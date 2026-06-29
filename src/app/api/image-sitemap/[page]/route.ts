import { NextResponse } from "next/server"
import generatedImageSitemap from "@/lib/search/generated-image-sitemap.json"
import { expandImageUrl } from "@/lib/search/image-url"
import {
  getImageSitemapPageCount,
  PRODUCTS_PER_IMAGE_SITEMAP,
} from "@/lib/image-sitemap"
import type { CompactImageSitemapEntry } from "@/lib/search/index-types"

export const revalidate = 86400

const BASE_URL = "https://starfigsperu.com"
const imageSitemapEntries = generatedImageSitemap as CompactImageSitemapEntry[]

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function generateStaticParams() {
  const pageCount = getImageSitemapPageCount(imageSitemapEntries.length)

  return Array.from({ length: pageCount }, (_, page) => ({
    page: page.toString(),
  }))
}

export async function GET(
  _request: Request,
  { params }: { params: { page: string } },
) {
  const page = Number(params.page)
  const pageCount = getImageSitemapPageCount(imageSitemapEntries.length)

  if (!Number.isInteger(page) || page < 0 || page >= pageCount) {
    return NextResponse.json({ error: "Sitemap page not found" }, { status: 404 })
  }

  const startIndex = page * PRODUCTS_PER_IMAGE_SITEMAP
  const entries = imageSitemapEntries
    .slice(startIndex, startIndex + PRODUCTS_PER_IMAGE_SITEMAP)
    .map(([slug, name, compactImages]) => {
      const imageEntries = compactImages
        .map(expandImageUrl)
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
        .map((imageUrl) => `    <image:image>
      <image:loc>${xmlEscape(imageUrl)}</image:loc>
      <image:title>${xmlEscape(name)}</image:title>
      <image:caption>${xmlEscape(name)} - Figura de anime coleccionable en Starfigs Peru</image:caption>
    </image:image>`)
        .join("\n")

      if (!imageEntries) return ""

      return `  <url>
    <loc>${BASE_URL}/products/${xmlEscape(slug)}</loc>
${imageEntries}
  </url>`
    })
    .filter(Boolean)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
