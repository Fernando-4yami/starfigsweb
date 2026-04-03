// 🔧 Script para actualizar precios de X9.99 → X9.00
// Ejecutar con: node scripts/update-prices-round.mjs

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

// 🛡️ Leer credenciales desde serviceAccountKey.json
const serviceAccount = JSON.parse(readFileSync('./lib/firebase/serviceAccountKey.json', 'utf8'))

// 🔥 Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// 🎯 CONFIGURACIÓN
const CONFIG = {
  dryRun: false, // true = solo mostrar, false = aplicar cambios
}

/**
 * Obtener todos los productos
 */
async function getAllProducts() {
  try {
    console.log("🔍 Conectando a Firestore...")
    const snapshot = await db.collection('products').get()

    console.log(`📄 Documentos encontrados: ${snapshot.size}`)

    if (snapshot.empty) {
      console.log("⚠️ No se encontraron productos")
      return []
    }

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || 'Sin nombre',
        price: data.price || 0,
      }
    })
  } catch (error) {
    console.error("❌ Error obteniendo productos:", error.message)
    throw error
  }
}

/**
 * Actualizar precio de producto
 */
async function updateProductPrice(productId, newPrice) {
  await db.collection('products').doc(productId).update({ price: newPrice })
}

/**
 * Convertir precio a .00 (quitar los centavos)
 * Ej: 129.99 → 129.00, 209.99 → 209.00
 */
function roundToWhole(price) {
  return Math.floor(price)
}

/**
 * Función principal
 */
async function main() {
  console.log("💰 SCRIPT DE ACTUALIZACIÓN DE PRECIOS X9.99 → X9.00")
  console.log("=".repeat(55))
  console.log(`\n🔧 Modo: ${CONFIG.dryRun ? "DRY RUN (sin cambios)" : "APLICAR CAMBIOS"}`)

  try {
    const products = await getAllProducts()
    console.log(`📦 Productos encontrados: ${products.length}`)

    if (products.length === 0) return

    // Filtrar solo los que tienen decimales
    const changes = products
      .filter(p => p.price % 1 !== 0)
      .map(p => ({
        ...p,
        newPrice: roundToWhole(p.price),
        difference: roundToWhole(p.price) - p.price,
      }))

    const skipped = products.length - changes.length

    console.log(`\n📋 CAMBIOS DETECTADOS: ${changes.length} productos`)
    if (skipped > 0) console.log(`⏭️  Sin cambio (ya son .00): ${skipped} productos`)

    if (changes.length === 0) {
      console.log("✅ Todos los precios ya están en formato .00, nada que hacer.")
      return
    }

    console.log("\n" + "-".repeat(70))
    console.log("PRODUCTO".padEnd(35) + "ANTES".padEnd(15) + "DESPUÉS")
    console.log("-".repeat(70))

    for (const c of changes) {
      const name = c.name.length > 33 ? c.name.slice(0, 30) + "..." : c.name
      const before = `S/. ${c.price.toFixed(2)}`
      const after  = `S/. ${c.newPrice.toFixed(2)}`
      console.log(name.padEnd(35) + before.padEnd(15) + after)
    }

    console.log("-".repeat(70))
    console.log(`📊 Total productos a actualizar: ${changes.length}`)

    if (CONFIG.dryRun) {
      console.log("\n⚠️  DRY RUN ACTIVADO — No se aplicaron cambios")
      console.log("👉 Cambia dryRun a false en CONFIG para aplicar.")
      return
    }

    console.log("\n🚀 APLICANDO CAMBIOS...")
    let success = 0, failed = 0

    for (const c of changes) {
      try {
        await updateProductPrice(c.id, c.newPrice)
        success++
        if (success % 10 === 0) console.log(`✅ ${success}/${changes.length} actualizados...`)
      } catch (err) {
        console.error(`❌ Error actualizando "${c.name}":`, err.message)
        failed++
      }
    }

    console.log(`\n🎉 COMPLETADO: ${success} productos actualizados`)
    if (failed > 0) console.log(`❌ Errores: ${failed}`)

  } catch (err) {
    console.error("❌ Error general:", err.message)
    console.error(err.stack)
  }
}

// Ejecutar
main().catch(console.error)
