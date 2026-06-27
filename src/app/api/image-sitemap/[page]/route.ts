import { NextResponse } from "next/server"
import { FieldPath } from "firebase-admin/firestore"
import { getDb } from "@/lib/firebase/admin"
import { PRODUCTS_PER_IMAGE_SITEMAP } from "@/lib/image-sitemap"

export const revalidate = 86400

const BASE_URL = "https://starfigsperu.com"

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function generateStaticParams() {
  const countSnapshot = await getDb().collection("products").count().get()
  const pageCount = Math.max(
    1,
    Math.ceil(countSnapshot.data().count / PRODUCTS_PER_IMAGE_SITEMAP),
  )

  return Array.from({ length: pageCount }, (_, page) => ({
    page: page.toString(),
  }))
}

export async function GET(
  _request: Request,
  { params }: { params: { page: string } },
) {
  const page = Number(params.page)
  if (!Number.isInteger(page) || page < 0) {
    return NextResponse.json({ error: "Invalid sitemap page" }, { status: 404 })
  }

  try {
    const snapshot = await getDb()
      .collection("products")
      .orderBy(FieldPath.documentId())
      .offset(page * PRODUCTS_PER_IMAGE_SITEMAP)
      .limit(PRODUCTS_PER_IMAGE_SITEMAP)
      .select("slug", "imageUrls", "thumbnailUrl", "name")
      .get()

    if (snapshot.empty && page > 0) {
      return NextResponse.json({ error: "Sitemap page not found" }, { status: 404 })
    }

    const entries: string[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      const slug = data.slug as string
      const name = data.name as string
      const imageUrls: string[] = data.imageUrls || []
      const thumbnailUrl = data.thumbnailUrl as string

      if (!slug || !name) return

      const images = [...new Set(thumbnailUrl ? [thumbnailUrl, ...imageUrls] : imageUrls)]
        .filter(Boolean)

      if (images.length === 0) return

      const imageEntries = images.map((imageUrl) => `    <image:image>
      <image:loc>${xmlEscape(imageUrl)}</image:loc>
      <image:title>${xmlEscape(name)}</image:title>
      <image:caption>${xmlEscape(name)} - Figura de anime coleccionable en Starfigs Peru</image:caption>
    </image:image>`).join("\n")

      entries.push(`  <url>
    <loc>${BASE_URL}/products/${xmlEscape(slug)}</loc>
${imageEntries}
  </url>`)
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error(`Error generating image sitemap page ${page}:`, error)
    return NextResponse.json({ error: "Error generating image sitemap" }, { status: 500 })
  }
}
