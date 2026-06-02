import type { MetadataRoute } from "next"
import { getDb } from "@/lib/firebase/admin"

const BASE_URL = "https://starfigsperu.com"

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
  ]

  // Obtener slugs de todos los productos desde Firestore
  let productSlugs: string[] = []
  try {
    const snapshot = await getDb().collection("products").select("slug").get()
    productSlugs = snapshot.docs
      .map((doc) => doc.data().slug as string)
      .filter((slug): slug is string => !!slug)
  } catch (error) {
    console.error("Error fetching product slugs for sitemap:", error)
  }

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages]
}
