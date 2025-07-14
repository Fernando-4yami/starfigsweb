// 🔧 Script para actualizar precios a formato X9.99 usando Admin SDK
// Ejecutar con: node scripts/update-prices-x9.mjs

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
  strategy: "nearest", // 'nearest', 'up', 'down', 'smart'
  minPrice: 10,
  maxPrice: 1000,
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
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        releaseDate: data.releaseDate?.toDate?.() || data.releaseDate,
        brand: data.brand,
        category: data.category,
        views: data.views || 0,
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
 * Redondear a X9.99
 */
function roundToX9_99(price, strategy = "nearest") {
  if (price < CONFIG.minPrice || price > CONFIG.maxPrice) return price

  const tens = Math.floor(price / 10) * 10
  const lowerPrice = tens - 1 + 0.99
  const upperPrice = tens + 9 + 0.99
  const validLowerPrice = lowerPrice < CONFIG.minPrice ? upperPrice : lowerPrice

  switch (strategy) {
    case "up":
      return upperPrice
    case "down":
      return validLowerPrice
    case "nearest":
      if (validLowerPrice === upperPrice) return upperPrice
      const diffUpper = Math.abs(price - upperPrice)
      const diffLower = Math.abs(price - validLowerPrice)
      return diffLower <= diffUpper ? validLowerPrice : upperPrice
    case "smart":
      const rangeStart = validLowerPrice + 0.01
      const rangeEnd = upperPrice - 0.01
      const rangeSize = rangeEnd - rangeStart
      const position = (price - rangeStart) / rangeSize
      if (position <= 0.33) return validLowerPrice
      else if (position >= 0.67) return upperPrice
      else return Math.abs(price - validLowerPrice) <= Math.abs(price - upperPrice) ? validLowerPrice : upperPrice
    default:
      return price
  }
}

/**
 * Mostrar ejemplos
 */
function showExamples() {
  const examples = [133.99, 136.99, 122.5, 127.3, 89.8, 199.0, 45.2, 78.9, 156.45, 234.67, 67.33, 183.88]

  console.log("\n📝 EJEMPLOS DE REDONDEO:")
  console.log("-".repeat(50))
  console.log("PRECIO ORIGINAL → PRECIO NUEVO")
  console.log("-".repeat(50))

  examples.forEach((price) => {
    const newPrice = roundToX9_99(price, CONFIG.strategy)
    const diff = newPrice - price
    const arrow = diff > 0 ? "↗️" : diff < 0 ? "↙️" : "➡️"
    console.log(`S/. ${price.toFixed(2).padEnd(8)} → S/. ${newPrice.toFixed(2)} ${arrow}`)
  })
}

/**
 * Función principal
 */
async function main() {
  console.log("💰 SCRIPT DE ACTUALIZACIÓN DE PRECIOS A FORMATO X9.99")
  console.log("=".repeat(55))
  console.log("📝 Formato objetivo: 19.99, 29.99, 39.99, etc.")

  console.log(`\n🔧 Configuración:`)
  console.log(`- Estrategia: ${CONFIG.strategy}`)
  console.log(`- Modo: ${CONFIG.dryRun ? "DRY RUN" : "APLICAR CAMBIOS"}`)
  console.log(`- Rango: S/. ${CONFIG.minPrice} - S/. ${CONFIG.maxPrice}`)

  showExamples()

  try {
    const products = await getAllProducts()
    console.log(`📦 Productos encontrados: ${products.length}`)

    if (products.length === 0) return

    const changes = []
    let processed = 0

    for (const product of products) {
      processed++
      const originalPrice = product.price
      const newPrice = roundToX9_99(originalPrice, CONFIG.strategy)

      if (Math.abs(originalPrice - newPrice) > 0.01) {
        changes.push({ ...product, newPrice, difference: newPrice - originalPrice })
      }

      if (processed % 50 === 0) console.log(`📊 Procesados: ${processed}/${products.length}`)
    }

    console.log("\n📋 CAMBIOS DETALLADOS:")
    console.log("-".repeat(85))
    console.log("PRODUCTO".padEnd(35) + "ANTES".padEnd(12) + "DESPUÉS".padEnd(12) + "DIF.".padEnd(12) + "TIPO")
    console.log("-".repeat(85))

    let totalDiff = 0, up = 0, down = 0

    for (const c of changes) {
      const name = c.name.length > 33 ? c.name.slice(0, 30) + "..." : c.name
      const before = `S/. ${c.price.toFixed(2)}`
      const after = `S/. ${c.newPrice.toFixed(2)}`
      const diff = c.difference >= 0 ? `+${c.difference.toFixed(2)}` : c.difference.toFixed(2)
      const tipo = c.difference > 0 ? "↗️ SUBE" : "↙️ BAJA"
      console.log(name.padEnd(35) + before.padEnd(12) + after.padEnd(12) + diff.padEnd(12) + tipo)
      totalDiff += c.difference
      if (c.difference > 0) up++
      else down++
    }

    const avgDiff = totalDiff / changes.length

    console.log("-".repeat(85))
    console.log(`💰 TOTAL DIF.: S/. ${totalDiff.toFixed(2)}`)
    console.log(`📈 Suben: ${up} | 📉 Bajan: ${down} | 📊 Promedio: S/. ${avgDiff.toFixed(2)}`)

    if (CONFIG.dryRun) {
      console.log("\n⚠️  DRY RUN ACTIVADO - No se aplicaron cambios")
    } else {
      console.log("\n🚀 APLICANDO CAMBIOS...")
      let success = 0, failed = 0
      for (const c of changes) {
        try {
          await updateProductPrice(c.id, c.newPrice)
          success++
          if (success % 10 === 0) console.log(`✅ ${success}/${changes.length} productos actualizados...`)
        } catch (err) {
          console.error(`❌ Error actualizando ${c.name}:`, err.message)
          failed++
        }
      }

      console.log(`\n🎉 COMPLETADO: ${success} actualizados`)
      if (failed > 0) console.log(`❌ Errores: ${failed}`)
    }
  } catch (err) {
    console.error("❌ Error general:", err.message)
    console.error(err.stack)
  }
}

// Ejecutar
main().catch(console.error)
