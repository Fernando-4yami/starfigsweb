import type { MetadataRoute } from "next"
import { getDb } from "@/lib/firebase/admin"
import posts from "@/lib/blog/posts"

const BASE_URL = "https://starfigsperu.com"
export const revalidate = 86400

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
    {
      url: `${BASE_URL}/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${BASE_URL}/categorias/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]

  // Blog pages — dinámico desde posts.ts para mantener consistencia
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  let products: Array<{ slug: string; lastModified: Date }> = []
  let lineSlugs: string[] = []
  try {
    // Keep every product discoverable while prerendering only the newest subset.
    const snapshot = await getDb().collection("products")
      .select("slug", "line", "updatedAt", "createdAt")
      .get()

    const uniqueLines = new Set<string>()

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const slug = data.slug as string
      const modifiedValue = data.updatedAt || data.createdAt
      const modifiedDate = modifiedValue?.toDate?.() || new Date(modifiedValue || Date.now())

      if (slug) {
        products.push({
          slug,
          lastModified: Number.isNaN(modifiedDate.getTime()) ? new Date() : modifiedDate,
        })
      }

      const line = data.line as string
      if (line && line.trim()) {
        const lowerLine = line.trim().toLowerCase()
        if (!CATEGORY_LINE_NAMES.has(lowerLine)) {
          uniqueLines.add(line.trim())
        }
      }
    })

    lineSlugs = Array.from(uniqueLines)
      .map(lineToSlug)
      .filter((slug) => slug.length > 0)
  } catch (error) {
    console.error("Error fetching products for sitemap:", error)
  }

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    lastModified: product.lastModified,
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
