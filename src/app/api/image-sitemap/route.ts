import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const revalidate = 43200 // 12 horas

const BASE_URL = "https://starfigsperu.com"

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  try {
    const db = getDb()

    const snapshot = await db
      .collection("products")
      .select("slug", "imageUrls", "thumbnailUrl", "name")
      .get()

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    let imageCount = 0
    snapshot.forEach((doc) => {
      const data = doc.data()
      const slug = data.slug as string
      const name = data.name as string
      const imageUrls: string[] = data.imageUrls || []
      const thumbnailUrl = data.thumbnailUrl as string

      // Si no tiene slug ni nombre, no lo incluimos
      if (!slug || !name) return

      // Usar todas las imágenes: thumbnail + imageUrls
      const allImages = thumbnailUrl ? [thumbnailUrl, ...imageUrls] : imageUrls
      const uniqueImages = [...new Set(allImages)].filter(Boolean)

      if (uniqueImages.length === 0) return

      xml += `  <url>
    <loc>${BASE_URL}/products/${xmlEscape(slug)}</loc>
`
      uniqueImages.forEach((imgUrl) => {
        imageCount++
        xml += `    <image:image>
      <image:loc>${xmlEscape(imgUrl)}</image:loc>
      <image:title>${xmlEscape(name)}</image:title>
      <image:caption>${xmlEscape(name)} - Figura de anime coleccionable en Starfigs Perú</image:caption>
    </image:image>
`
      })

      xml += `  </url>
`
    })

    xml += `</urlset>`

    console.log(`🖼️ Image Sitemap: ${imageCount} imágenes de productos`)

    const headers = new Headers()
    headers.set("Content-Type", "application/xml; charset=utf-8")
    headers.set("Cache-Control", "public, max-age=43200, s-maxage=43200, stale-while-revalidate=86400")

    return new NextResponse(xml, { status: 200, headers })
  } catch (error) {
    console.error("❌ Error generando image sitemap:", error)
    return NextResponse.json(
      { error: "Error generando image sitemap" },
      { status: 500 },
    )
  }
}
