import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"
import { PRODUCTS_PER_IMAGE_SITEMAP } from "@/lib/image-sitemap"

export const revalidate = 86400

const BASE_URL = "https://starfigsperu.com"

export async function GET() {
  try {
    const countSnapshot = await getDb().collection("products").count().get()
    const productCount = countSnapshot.data().count
    const pageCount = Math.max(1, Math.ceil(productCount / PRODUCTS_PER_IMAGE_SITEMAP))

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
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error("Error generating image sitemap index:", error)
    return NextResponse.json({ error: "Error generating image sitemap index" }, { status: 500 })
  }
}
