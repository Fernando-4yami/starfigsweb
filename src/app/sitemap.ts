import type { MetadataRoute } from "next"
import { getDb } from "@/lib/firebase/admin"

const BASE_URL = "https://starfigsperu.com"

// Líneas que YA son categorías (no duplicar en /lines/)
const CATEGORY_LINE_NAMES = new Set([
  "nendoroid",
  "figma",
  "s.h.figuarts",
  "ichiban kuji",
  "pop up parade",
  "pop-up parade",
])

const CATEGORY_SLUGS = [
  "nendoroid",
  "figma",
  "figuarts",
  "ichiban-kuji",
  "pop-up-parade",
  "plush",
  "scale",
  "pricing",
]

// Convierte nombre de línea a slug URL
function lineToSlug(lineName: string): string {
  return lineName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${BASE_URL}/categorias/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]

  // Blog pages
  const blogSlugs = [
    "como-identificar-figuras-anime-originales-peru",
    "nendoroid-vs-figma-vs-escala-diferencias",
    "guia-completa-tipos-figuras-anime",
    "donde-comprar-figuras-anime-originales-peru",
    "como-funciona-preventa-figuras-anime",
    "top-10-figuras-anime-coleccionistas-2025",
  ]

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Cache en memoria por 30 min para evitar 10k+ reads por crawl
  let productSlugs: string[] = []
  let lineSlugs: string[] = []
  const CACHE_KEY = "sitemap-data"
  const CACHE_TTL = 30 * 60 * 1000 // 30 min

  const cachedData = (globalThis as any)[CACHE_KEY]
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    productSlugs = cachedData.slugs
    lineSlugs = cachedData.lineSlugs
  } else {
    try {
      // Traer slug + line de todos los productos (no cuesta más reads, solo un campo extra)
      const snapshot = await getDb().collection("products").select("slug", "line").get()

      productSlugs = []
      const uniqueLines = new Set<string>()

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const slug = data.slug as string
        if (slug) productSlugs.push(slug)

        const line = data.line as string
        if (line && line.trim()) {
          const lowerLine = line.trim().toLowerCase()
          // Solo líneas que NO sean categorías
          if (!CATEGORY_LINE_NAMES.has(lowerLine)) {
            uniqueLines.add(line.trim())
          }
        }
      })

      // Convertir nombres de línea a slugs
      lineSlugs = Array.from(uniqueLines)
        .map(lineToSlug)
        .filter((slug) => slug.length > 0)

      // Cachear en memoria global
      ;(globalThis as any)[CACHE_KEY] = {
        slugs: productSlugs,
        lineSlugs,
        timestamp: Date.now(),
      }

      console.log(`🗺️ Sitemap: ${productSlugs.length} slugs, ${lineSlugs.length} líneas (cache 30 min)`)
    } catch (error) {
      console.error("Error fetching products for sitemap:", error)
    }
  }

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  const linePages: MetadataRoute.Sitemap = lineSlugs.map((slug) => ({
    url: `${BASE_URL}/lines/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  console.log(`🗺️ Sitemap total: ${staticPages.length} estáticas + ${blogPages.length} blog + ${productPages.length} productos + ${linePages.length} líneas = ${staticPages.length + blogPages.length + productPages.length + linePages.length} URLs`)

  return [...staticPages, ...blogPages, ...productPages, ...linePages]
}
