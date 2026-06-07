// 🔧 SCRIPT: Generar thumbnails (200px WebP) para productos que no tienen thumbnailUrl
// Ejecutar: node scripts/generate-thumbnails.mjs
//
// ⚠️ DRY RUN: node scripts/generate-thumbnails.mjs --dry-run
// APLICAR:   node scripts/generate-thumbnails.mjs

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import sharp from 'sharp'
import https from 'https'
import http from 'http'

const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 10
const PAUSE_MS = 500

// 🔥 Inicializar Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./lib/firebase/serviceAccountKey.json', 'utf8'))
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'starfigs-29d31',
})
const db = admin.firestore()
const bucket = admin.storage().bucket('starfigs-29d31')

// ─── HELPERS ─────────────────────────────────

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StarfigsBot/1.0)' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('Timeout')) })
  })
}

async function uploadToStorage(buffer, filename) {
  const file = bucket.file(`products/${filename}`)
  await file.save(buffer, {
    metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' },
  })
  await file.makePublic()
  return `https://storage.googleapis.com/starfigs-29d31/products/${encodeURIComponent(filename)}`
}

async function generateThumbnail(imageUrl) {
  const buffer = await downloadImage(imageUrl)
  return sharp(buffer)
    .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 65 })
    .toBuffer()
}

// ─── MAIN ────────────────────────────────────

async function main() {
  console.log('🖼️  GENERADOR DE THUMBNAILS')
  console.log('='.repeat(50))
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN' : 'APLICAR'}\n`)

  // Solo traer los campos necesarios (ahorra memoria)
  console.log('📡 Buscando productos...')
  const snapshot = await db.collection('products').select('imageUrls', 'thumbnailUrl', 'name').get()

  const candidates = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => Array.isArray(p.imageUrls) && p.imageUrls.length > 0 && !p.thumbnailUrl)

  console.log(`Total: ${snapshot.size}  |  Sin thumbnail: ${candidates.length}  |  Con thumbnail: ${snapshot.size - candidates.length}\n`)

  if (candidates.length === 0) { console.log('🎉 Todo ok'); return }

  if (DRY_RUN) {
    console.log('Primeros 10:')
    candidates.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i + 1}. ${(p.name || '').slice(0, 45).padEnd(47)} ${(p.imageUrls[0] || '').slice(0, 50)}`)
    })
    console.log(`\n⚠️  DRY RUN — Ejecuta sin --dry-run para aplicar`)
    return
  }

  let success = 0, failed = 0

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    console.log(`\n📦 Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(candidates.length / BATCH_SIZE)}`)

    await Promise.allSettled(batch.map(async (p) => {
      try {
        const buf = await generateThumbnail(p.imageUrls[0])
        const url = await uploadToStorage(buf, `thumb_${p.id}_200.webp`)
        await db.collection('products').doc(p.id).update({ thumbnailUrl: url })
        success++
        console.log(`  ✅ ${(p.name || '').slice(0, 50).padEnd(52)} ${(buf.length / 1024).toFixed(0)}KB`)
      } catch (err) {
        failed++
        console.error(`  ❌ ${(p.name || '').slice(0, 50).padEnd(52)} ${err.message.slice(0, 50)}`)
      }
    }))

    if (i + BATCH_SIZE < candidates.length) await new Promise(r => setTimeout(r, PAUSE_MS))
  }

  console.log(`\n🎉 OK: ${success}  |  Error: ${failed}`)
  if (failed) console.log('Re-ejecuta para reintentar los que fallaron.')
}

main().catch(e => { console.error('❌', e); process.exit(1) })
