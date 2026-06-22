import { google } from "googleapis"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Cargar credenciales
const credentials = JSON.parse(
  readFileSync(join(__dirname, "..", "lib", "search-console", "credentials.json"), "utf-8")
)

const SITE_URL = "https://starfigsperu.com"
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

async function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })
  const client = await auth.getClient()
  return google.webmasters({
    version: "v3",
    auth: client,
  })
}

async function getPerformanceData(webmasters, days = 90) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const formatDate = (d) => d.toISOString().split("T")[0]

  // Consulta principal: top queries
  const queryResult = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["query"],
      rowLimit: 100,
    },
  })

  // Consulta por página
  const pageResult = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["page"],
      rowLimit: 100,
    },
  })

  // Total general
  const totalResult = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
  })

  // Consulta por dispositivo (mobile, desktop, tablet)
  const deviceResult = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["device"],
    },
  })

  return {
    total: totalResult.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    byQuery: queryResult.data.rows || [],
    byPage: pageResult.data.rows || [],
    byDevice: deviceResult.data.rows || [],
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

async function getSitemaps(webmasters) {
  const result = await webmasters.sitemaps.list({ siteUrl: SITE_URL })
  return result.data.sitemap || []
}

async function getLast7Days(webmasters) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const formatDate = (d) => d.toISOString().split("T")[0]

  const result = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["query"],
      rowLimit: 20,
    },
  })

  const pageResult = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["page"],
      rowLimit: 20,
    },
  })

  return {
    queries: result.data.rows || [],
    pages: pageResult.data.rows || [],
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

async function main() {
  console.log("🔍 Consultando Google Search Console API...\n")

  const webmasters = await getClient()

  // 1. Datos de rendimiento últimos 90 días
  console.log("📊 1. RENDIMIENTO GENERAL (últimos 90 días)")
  console.log("─".repeat(50))
  const perf = await getPerformanceData(webmasters, 90)

  const total = perf.total
  console.log(`   Período: ${perf.startDate} → ${perf.endDate}`)
  console.log(`   Clicks totales:      ${total.clicks ?? 0}`)
  console.log(`   Impresiones totales: ${total.impressions ?? 0}`)
  console.log(`   CTR promedio:        ${((total.ctr ?? 0) * 100).toFixed(2)}%`)
  console.log(`   Posición promedio:   ${(total.position ?? 0).toFixed(1)}`)

  // Por dispositivo
  console.log(`\n   Por dispositivo:`)
  for (const row of perf.byDevice) {
    console.log(`   • ${row.keys[0]}: ${row.clicks} clicks, ${row.impressions} impresiones, ${(row.ctr * 100).toFixed(2)}% CTR, posición ${row.position.toFixed(1)}`)
  }

  // 2. Top 10 queries
  console.log(`\n📈 2. TOP 10 CONSULTAS (últimos 90 días)`)
  console.log("─".repeat(50))
  console.log(`   # | Consulta                          | Clicks | Impresiones | CTR    | Posición`)
  console.log("   " + "─".repeat(85))
  perf.byQuery.slice(0, 10).forEach((row, i) => {
    const query = (row.keys[0] || "").padEnd(35).slice(0, 35)
    console.log(`   ${(i + 1).toString().padStart(2)} | ${query} | ${row.clicks.toString().padStart(6)} | ${row.impressions.toString().padStart(10)} | ${(row.ctr * 100).toFixed(1).padStart(5)}% | ${row.position.toFixed(1).padStart(5)}`)
  })

  // 3. Top 10 páginas
  console.log(`\n📄 3. TOP 10 PÁGINAS (últimos 90 días)`)
  console.log("─".repeat(50))
  perf.byPage.slice(0, 10).forEach((row, i) => {
    const page = (row.keys[0] || "").replace("https://starfigsperu.com", "").padEnd(45).slice(0, 45)
    console.log(`   ${(i + 1).toString().padStart(2)} | ${page} | ${row.clicks.toString().padStart(4)} clicks | ${row.impressions.toString().padStart(6)} imp | ${(row.ctr * 100).toFixed(1)}% CTR | Pos ${row.position.toFixed(1)}`)
  })

  // 4. Sitemaps
  console.log(`\n🗺️ 4. SITEMAPS`)
  console.log("─".repeat(50))
  const sitemaps = await getSitemaps(webmasters)
  for (const sitemap of sitemaps) {
    console.log(`   • ${sitemap.path}`)
    console.log(`     Indexados: ${sitemap.contents?.[0]?.indexed ?? "?"} / Enviados: ${sitemap.contents?.[0]?.submitted ?? sitemap.contents ?? "?"}`)
  }

  // 5. Últimos 7 días detallado
  console.log(`\n📅 5. ÚLTIMOS 7 DÍAS`)
  console.log("─".repeat(50))
  const last7 = await getLast7Days(webmasters)
  
  const total7 = last7.queries.reduce((acc, row) => ({ clicks: acc.clicks + row.clicks, impressions: acc.impressions + row.impressions }), { clicks: 0, impressions: 0 })
  console.log(`   Clicks: ${total7.clicks} | Impresiones: ${total7.impressions}`)
  
  console.log(`\n   Top 10 consultas (7 días):`)
  console.log(`   # | Consulta                          | Clicks | Impresiones | CTR    | Posición`)
  console.log("   " + "─".repeat(85))
  last7.queries.slice(0, 10).forEach((row, i) => {
    const query = (row.keys[0] || "").padEnd(35).slice(0, 35)
    console.log(`   ${(i + 1).toString().padStart(2)} | ${query} | ${row.clicks.toString().padStart(6)} | ${row.impressions.toString().padStart(10)} | ${(row.ctr * 100).toFixed(1).padStart(5)}% | ${row.position.toFixed(1).padStart(5)}`)
  })

  console.log(`\n   Top 10 páginas (7 días):`)
  last7.pages.slice(0, 10).forEach((row, i) => {
    const page = (row.keys[0] || "").replace("https://starfigsperu.com", "").padEnd(45).slice(0, 45)
    console.log(`   ${(i + 1).toString().padStart(2)} | ${page} | ${row.clicks.toString().padStart(4)} clicks | ${row.impressions.toString().padStart(6)} imp | Pos ${row.position.toFixed(1)}`)
  })

  console.log("\n✅ Reporte completo")
}

main().catch(console.error)
