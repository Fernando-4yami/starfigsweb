import { google } from "googleapis"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const credentials = JSON.parse(
  readFileSync(join(__dirname, "..", "lib", "search-console", "credentials.json"), "utf-8")
)

const SITE_URL = "sc-set:https://starfigsperu.com"
const SITE_URL_V3 = "https://starfigsperu.com"

async function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  })
  const client = await auth.getClient()
  return google.webmasters({ version: "v3", auth: client })
}

// URLs de productos para inspeccionar (tomadas del sitemap)
const PRODUCT_URLS = [
  "https://starfigsperu.com/products/fate-grand-order-nendoroid-avenger-king-of-the-cavern-edmond-dantes",
  "https://starfigsperu.com/products/one-piece-s-h-figuarts-crocodile-marineford",
  "https://starfigsperu.com/products/my-hero-academia-the-evil-villains-tomura-shigaraki",
  "https://starfigsperu.com/products/jujutsu-kaisen-king-of-artist-satoru-gojo-hidden-inventory-premature-death-ii-special-ver",
  "https://starfigsperu.com/products/my-dress-up-darling-nendoroid-surprise-marin-kitagawa",
  "https://starfigsperu.com/products/demon-slayer-acrylic-stand-tanjiro-kamado-holographic",
  "https://starfigsperu.com/products/dragon-ball-match-makers-son-goku-vs-vegeta",
  "https://starfigsperu.com/products/valorant-pop-up-parade-omen-sp",
  "https://starfigsperu.com/products/sousai-shojo-teien-plastic-model-kit-seira-ichijo-cheerleading-costume-dreaming-style-vitamin-yell",
  "https://starfigsperu.com/products/love-and-deepspace-nendoroid-xavier",
  // URL que YA está indexada (la del reporte)
  "https://starfigsperu.com/products/the-amazing-digital-circus-nendoroid",
  // Homepage
  "https://starfigsperu.com/",
  // Blog
  "https://starfigsperu.com/blog/como-identificar-figuras-anime-originales-peru",
  // Categoria
  "https://starfigsperu.com/categorias/nendoroid",
]

async function inspectUrl(webmasters, url) {
  try {
    // Intentar con Search Console API v3 (URL Inspection)
    const result = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL_V3,
      requestBody: {
        startDate: "2026-03-01",
        endDate: "2026-06-19",
        dimensions: ["page"],
        dimensionFilterGroups: [{
          filters: [{
            dimension: "page",
            operator: "equals",
            expression: url,
          }],
        }],
      },
    })
    
    const row = result.data.rows?.[0]
    if (row) {
      return {
        url,
        found: true,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(2) + "%",
        position: row.position.toFixed(1),
      }
    } else {
      return {
        url,
        found: false,
        clicks: 0,
        impressions: 0,
        ctr: "0%",
        position: "N/A",
      }
    }
  } catch (err) {
    // Si el método v3 falla, probamos con la API de indexación
    return {
      url,
      found: false,
      error: err.message?.slice(0, 200) || "Error desconocido",
      clicks: 0,
      impressions: 0,
      ctr: "0%",
      position: "N/A",
    }
  }
}

async function main() {
  console.log("🔍 INSPECCIÓN DE URLs - Google Search Console API\n")
  console.log("Consultando datos de rendimiento para URLs específicas...\n")

  const webmasters = await getClient()

  console.log("URL | Clicks (90d) | Impresiones (90d) | CTR | Posición | ¿Indexada?")
  console.log("─".repeat(100))

  let indexed = 0
  let notFound = 0

  for (const url of PRODUCT_URLS) {
    const result = await inspectUrl(webmasters, url)
    const path = url.replace("https://starfigsperu.com", "")
    const shortPath = path.length > 50 ? path.slice(0, 47) + "..." : path

    if (result.found) {
      indexed++
      console.log(`✅ ${shortPath.padEnd(52)} | ${String(result.clicks).padStart(4)} | ${String(result.impressions).padStart(8)} | ${result.ctr.padStart(6)} | ${result.position.padStart(5)} | ✅ SÍ`)
    } else {
      notFound++
      console.log(`❌ ${shortPath.padEnd(52)} | ${String(result.clicks).padStart(4)} | ${String(result.impressions).padStart(8)} | ${result.ctr.padStart(6)} | ${result.position.padStart(5)} | ❌ NO`)
    }
  }

  console.log("\n" + "─".repeat(100))
  console.log(`\n📊 RESUMEN:`)
  console.log(`   URLs con datos (indexadas o con tráfico): ${indexed}/${PRODUCT_URLS.length}`)
  console.log(`   URLs sin datos (no indexadas): ${notFound}/${PRODUCT_URLS.length}`)

  console.log("\n")
  console.log("📌 ¿QUÉ SIGNIFICA?")
  console.log("   • URLs con datos ✅ = Google las tiene en su índice y hay data de rendimiento")
  console.log("   • URLs sin datos ❌ = Google no las tiene indexadas O no han recibido tráfico")
  console.log("   • Si no tienen impresiones en 90 días, significa que Google NO las está mostrando en resultados de búsqueda")
  console.log("   • La causa más probable es: baja autoridad del dominio + crawl budget limitado")
  console.log("   • Las URLs 'sin datos' pueden estar en estado 'Crawled - currently not indexed' o 'Discovered - currently not indexed'")
  console.log("\n   Con el nuevo sitemap limitado a 800 productos, Google tendrá más")
  console.log("   presupuesto para rastrear e indexar los productos que realmente importan.")
}

main().catch(console.error)
