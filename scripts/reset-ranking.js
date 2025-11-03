// 🔄 Script para reiniciar el ranking semanal
// Ejecutar con: node scripts/reset-ranking.mjs

import admin from 'firebase-admin'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

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

// Función para preguntar confirmación
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans)
    }),
  )
}

// 📊 Mostrar estadísticas del ranking
async function showStats() {
  console.log('\n📊 ESTADÍSTICAS DEL RANKING ACTUAL:')
  console.log('=====================================\n')

  const snapshot = await db.collection('products').get()

  if (snapshot.empty) {
    console.log('⚠️ No hay productos en la base de datos.')
    return { total: 0, withViews: 0 }
  }

  const productsWithViews = []
  let total = 0
  let withViews = 0
  let totalViews = 0
  let maxViews = 0

  snapshot.forEach((doc) => {
    const data = doc.data()
    const views = data.views || 0

    total++
    totalViews += views

    if (views > maxViews) maxViews = views

    if (views > 0) {
      withViews++
      productsWithViews.push({
        name: data.name || 'Sin nombre',
        views: views,
      })
    }
  })

  productsWithViews.sort((a, b) => b.views - a.views)
  const top10 = productsWithViews.slice(0, 10)

  console.log(`📦 Total de productos: ${total}`)
  console.log(`👁️  Productos con visitas: ${withViews}`)
  console.log(`📈 Total de visitas: ${totalViews}`)
  console.log(`🏆 Máximo de visitas: ${maxViews}`)
  console.log(`📊 Promedio: ${total > 0 ? Math.round(totalViews / total) : 0} visitas\n`)

  if (top10.length > 0) {
    console.log('🏆 TOP 10 ACTUAL:')
    top10.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ${p.views} visitas`)
    })
    console.log('')
  }

  return { total, withViews }
}

// 🔄 Resetear el ranking
async function resetRanking() {
  console.log('\n🔄 Iniciando reset del ranking...\n')

  const snapshot = await db.collection('products').get()

  if (snapshot.empty) {
    console.log('⚠️ No hay productos para resetear')
    return { updated: 0, errors: 0 }
  }

  const batch = db.batch()
  let count = 0

  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      views: 0,
      lastViewedAt: null,
      lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    count++
  })

  try {
    await batch.commit()
    console.log(`✅ Ranking reiniciado exitosamente!`)
    console.log(`   - ${count} productos reiniciados a 0 vistas`)
    console.log(`   - Fecha: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}\n`)
    return { updated: count, errors: 0 }
  } catch (error) {
    console.error('❌ Error al ejecutar el batch:', error.message)
    return { updated: 0, errors: 1 }
  }
}

// 🎯 Script principal
async function main() {
  console.log('\n🎯 RESET SEMANAL DEL RANKING')
  console.log('=============================\n')

  try {
    // Mostrar estadísticas actuales
    const stats = await showStats()

    if (stats.total === 0) {
      console.log('❌ No hay productos para resetear.\n')
      return
    }

    // Preguntar confirmación
    console.log('⚠️  ATENCIÓN: Esto reiniciará TODAS las visitas a 0')
    const answer = await askQuestion('¿Estás seguro de continuar? (si/no): ')

    if (answer.toLowerCase() === 'si' || answer.toLowerCase() === 's') {
      const result = await resetRanking()

      if (result.updated > 0) {
        console.log('🎉 ¡Proceso completado exitosamente!')
        console.log(`✅ Productos actualizados: ${result.updated}`)
        console.log(`❌ Errores: ${result.errors}\n`)
      }
    } else {
      console.log('\n❌ Operación cancelada. No se hicieron cambios.\n')
    }
  } catch (error) {
    console.error('❌ Error general del script:', error.message)
  }
}

main().catch((err) => {
  console.error('❌ Error fatal:', err.message)
  process.exit(1)
})