import type { MetadataRoute } from "next"
import { getDb } from "@/lib/firebase/admin"

const BASE_URL = "https://starfigsperu.com"

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
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${BASE_URL}/categorias/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]

  // Obtener slugs de todos los productos desde Firestore
  // 🔥 Cache en memoria por 30 min para evitar 10k+ reads por crawl
  let productSlugs: string[] = []
  const CACHE_KEY = "sitemap-product-slugs"
  const CACHE_TTL = 30 * 60 * 1000 // 30 min

  const cachedData = (globalThis as any)[CACHE_KEY]
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    productSlugs = cachedData.slugs
  } else {
    try {
      const snapshot = await getDb().collection("products").select("slug").get()
      productSlugs = snapshot.docs
        .map((doc) => doc.data().slug as string)
        .filter((slug): slug is string => !!slug)

      // Cachear en memoria global
      ;(globalThis as any)[CACHE_KEY] = {
        slugs: productSlugs,
        timestamp: Date.now(),
      }

      console.log(`🗺️ Sitemap: ${productSlugs.length} slugs cargados (cache 30 min)`)
    } catch (error) {
      console.error("Error fetching product slugs for sitemap:", error)
    }
  }

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages]
}
