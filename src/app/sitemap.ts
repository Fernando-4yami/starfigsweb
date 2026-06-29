import type { MetadataRoute } from "next"
import posts from "@/lib/blog/posts"
import generatedSitemap from "@/lib/search/generated-sitemap.json"
import type { CompactSitemapEntry } from "@/lib/search/index-types"

const BASE_URL = "https://starfigsperu.com"
export const revalidate = 86400

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

const sitemapEntries = generatedSitemap as CompactSitemapEntry[]

function lineToSlug(lineName: string): string {
  return lineName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function dateFromMs(value: number): Date {
  const date = new Date(value || Date.now())
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export default function sitemap(): MetadataRoute.Sitemap {
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

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const uniqueLineSlugs = new Set<string>()
  const productPages: MetadataRoute.Sitemap = sitemapEntries.map(
    ([slug, line, modifiedAtMs]) => {
      if (line && line.trim() && !CATEGORY_LINE_NAMES.has(line.trim().toLowerCase())) {
        const lineSlug = lineToSlug(line)
        if (lineSlug) uniqueLineSlugs.add(lineSlug)
      }

      return {
        url: `${BASE_URL}/products/${slug}`,
        lastModified: dateFromMs(modifiedAtMs),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }
    },
  )

  const linePages: MetadataRoute.Sitemap = Array.from(uniqueLineSlugs).map((slug) => ({
    url: `${BASE_URL}/lines/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages, ...productPages, ...linePages]
}
