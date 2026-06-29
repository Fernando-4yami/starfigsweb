import { NextResponse } from "next/server"
import generatedImageSitemap from "@/lib/search/generated-image-sitemap.json"
import { getImageSitemapPageCount } from "@/lib/image-sitemap"
import type { CompactImageSitemapEntry } from "@/lib/search/index-types"

export const revalidate = 86400

const BASE_URL = "https://starfigsperu.com"
const imageSitemapEntries = generatedImageSitemap as CompactImageSitemapEntry[]

export async function GET() {
  const pageCount = getImageSitemapPageCount(imageSitemapEntries.length)
  const sitemapEntries = Array.from(
    { length: pageCount },
    (_, page) => `  <sitemap>
    <loc>${BASE_URL}/api/image-sitemap/${page}</loc>
  </sitemap>`,
  ).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
