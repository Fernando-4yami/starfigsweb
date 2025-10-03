// 🔧 Script para reducir S/. 10 a productos de 10 soles o menos
// Ejecutar con: node scripts/decrease-under-10-by-10.mjs

import admin from 'firebase-admin'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Ruta del archivo serviceAccountKey.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serviceAccountPath = path.join(__dirname, '../lib/firebase/serviceAccountKey.json')

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// 🔧 Configuración
const CONFIG = {
  decreaseAmount: 10,
  maxPrice: 10,
  collectionName: 'products',
}

async function main() {
  console.log(`🔧 Reduciendo S/. ${CONFIG.decreaseAmount} a productos con precio <= S/. ${CONFIG.maxPrice}...`)
  const snapshot = await db.collection(CONFIG.collectionName).get()

  if (snapshot.empty) {
    console.log('⚠️ No se encontraron productos.')
    return
  }

  let updated = 0
  let errors = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const originalPrice = data.price

    if (typeof originalPrice !== 'number') {
      console.warn(`⛔ Producto inválido (${doc.id}): precio no numérico`)
      errors++
      continue
    }

    if (originalPrice <= CONFIG.maxPrice) {
      const newPrice = Math.max(0, originalPrice - CONFIG.decreaseAmount) // Evitar precios negativos

      try {
        await doc.ref.update({ price: newPrice })
        updated++
        console.log(`✅ ${data.name || doc.id}: S/. ${originalPrice} → S/. ${newPrice}`)
      } catch (err) {
        console.error(`❌ Error al actualizar ${data.name || doc.id}:`, err.message)
        errors++
      }
    }
  }

  console.log('\n🎉 ¡Completado!')
  console.log(`✅ Productos actualizados: ${updated}`)
  console.log(`❌ Errores: ${errors}`)
}

main().catch((err) => {
  console.error('❌ Error general del script:', err.message)
})
