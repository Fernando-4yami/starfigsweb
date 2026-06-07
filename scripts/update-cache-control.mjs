// 🔧 SCRIPT: Actualizar Cache-Control de imágenes existentes en Firebase Storage
// Las imágenes subidas antes de implementar cacheControl pueden tener TTL de 1h.
// Este script las actualiza a 1 año para mejorar caché en visitas repetidas.
//
// DRY RUN: node scripts/update-cache-control.mjs --dry-run
// APLICAR:  node scripts/update-cache-control.mjs

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 50

const serviceAccount = JSON.parse(readFileSync('./lib/firebase/serviceAccountKey.json', 'utf8'))
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'starfigs-29d31',
})
const bucket = admin.storage().bucket('starfigs-29d31')

async function main() {
  console.log('🔄 ACTUALIZAR CACHE-CONTROL')
  console.log('='.repeat(50))
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN' : 'APLICAR'}\n`)

  const [files] = await bucket.getFiles({ prefix: 'products/' })
  console.log(`📁 Archivos en products/: ${files.length}`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    console.log(`\n📦 Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`)

    await Promise.allSettled(batch.map(async (file) => {
      try {
        const [metadata] = await file.getMetadata()
        const current = metadata.cacheControl || ''

        // Si ya tiene cache de 1 año, saltar
        if (current.includes('max-age=31536000')) {
          skipped++
          return
        }

        const name = file.name.slice(0, 60)
        console.log(`  ${current ? `🔄 ${current} → 1 año` : '➕ Sin cache → 1 año'}  ${name}`)

        if (!DRY_RUN) {
          await file.setMetadata({
            cacheControl: 'public, max-age=31536000, immutable',
          })
        }
        updated++
      } catch (err) {
        failed++
        console.error(`  ❌ ${file.name.slice(0, 60)}: ${err.message}`)
      }
    }))

    if (i + BATCH_SIZE < files.length) await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n📊 Resultados:`)
  console.log(`   Actualizados: ${updated}`)
  console.log(`   Saltados (ya 1 año): ${skipped}`)
  console.log(`   Fallos: ${failed}`)
  if (DRY_RUN) console.log(`\n⚠️  DRY RUN — Ejecuta sin --dry-run para aplicar`)
}

main().catch(e => { console.error('❌', e); process.exit(1) })
