import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"

export const revalidate = 86400

const BASE_URL = "https://starfigsperu.com"

interface FeedProduct {
  id: string
  name: string
  slug: string
  price?: number
  description?: string
  description_es?: string
  imageUrls?: string[]
  thumbnailUrl?: string
  brand?: string
  category?: string
  stock?: number
  gtin?: string
  line?: string
  scale?: string
  releaseDate?: string | null
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getGoogleCategory(category?: string): string {
  const map: Record<string, string> = {
    figura: "6006",
    nendoroid: "6006",
    figma: "6006",
    "pop-up-parade": "6006",
    "ichiban-kuji": "6006",
    scale: "6006",
    plush: "2121",
    figuarts: "6006",
    pricing: "6006",
  }

  if (!category) return "6006"
  return map[category.toLowerCase().trim()] || "6006"
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} PEN`
}

function toIsoDate(value: any): string | null {
  if (!value) return null

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

async function loadFeedProducts(): Promise<FeedProduct[]> {
  const snapshot = await getDb()
    .collection("products")
    .select(
      "name",
      "slug",
      "price",
      "description",
      "description_es",
      "imageUrls",
      "thumbnailUrl",
      "brand",
      "category",
      "stock",
      "gtin",
      "line",
      "scale",
      "releaseDate",
    )
    .get()

  const products: FeedProduct[] = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (!data.name) return

    products.push({
      id: doc.id,
      name: data.name,
      slug: data.slug || doc.id,
      price: data.price,
      description: data.description,
      description_es: data.description_es,
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      thumbnailUrl: data.thumbnailUrl,
      brand: data.brand,
      category: data.category,
      stock: data.stock,
      gtin: data.gtin,
      line: data.line,
      scale: data.scale,
      releaseDate: toIsoDate(data.releaseDate),
    })
  })

  return products
}

const getCachedFeedProducts = unstable_cache(
  loadFeedProducts,
  ["google-product-feed-v2"],
  { revalidate: 86400 },
)

export async function GET() {
  try {
    const products = await getCachedFeedProducts()

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Starfigs Peru - Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Figuras de anime originales importadas desde Japon. Preventas, pedidos por encargo y envios a todo el Peru.</description>
`

    for (const product of products) {
      const imageUrl = product.imageUrls?.[0] || product.thumbnailUrl || ""
      const name = product.name || ""
      const slug = product.slug || product.id
      const hasPrice = product.price !== undefined && product.price !== null && product.price > 0
      const price = hasPrice ? Number(product.price) : 100

      let availability: string
      let availabilityDate = ""
      if (product.stock !== undefined && product.stock > 0) {
        availability = "in_stock"
      } else if (product.releaseDate) {
        availability = "preorder"
        availabilityDate = product.releaseDate.slice(0, 10)
        if (!availabilityDate) availability = "backorder"
      } else {
        availability = "backorder"
      }

      const rawBrand = (product.brand || "").trim()
      const brand = rawBrand && rawBrand !== "Sin marca" ? rawBrand : "Otros"
      const rawDesc = (product.description_es || product.description || "").trim()
      const description =
        rawDesc.length >= 50
          ? rawDesc
          : `${name} - Figura de anime coleccionable 100% original, importada desde Japon. Ideal para tu vitrina o como regalo para fans del anime. Producto en preventa.`
      const category = product.category || "figura"

      xml += `    <item>
      <g:id>${xmlEscape(slug)}</g:id>
      <g:title>${xmlEscape(name)}</g:title>
      <g:description>${xmlEscape(description.substring(0, 5000))}</g:description>
      <g:link>${BASE_URL}/products/${xmlEscape(slug)}</g:link>
      <g:image_link>${xmlEscape(imageUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>${availabilityDate && availability === "preorder" ? `
      <g:availability_date>${availabilityDate}</g:availability_date>` : ""}
      <g:price>${formatPrice(price)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:product_type>${xmlEscape(category)}</g:product_type>
      <g:google_product_category>${getGoogleCategory(category)}</g:google_product_category>`

      if (product.gtin) {
        xml += `
      <g:gtin>${xmlEscape(product.gtin)}</g:gtin>`
      } else {
        xml += `
      <g:identifier_exists>false</g:identifier_exists>`
      }

      xml += `
      <g:mpn>${xmlEscape(slug)}</g:mpn>`

      if (product.line) {
        xml += `
      <g:custom_label_0>${xmlEscape(product.line)}</g:custom_label_0>`
      }

      if (product.scale) {
        xml += `
      <g:custom_label_1>${xmlEscape(product.scale)}</g:custom_label_1>`
      }

      xml += `
      <g:custom_label_2>${xmlEscape(category)}</g:custom_label_2>
    </item>
`
    }

    xml += `  </channel>
</rss>`

    const headers = new Headers()
    headers.set("Content-Type", "application/xml; charset=utf-8")
    headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    )

    return new NextResponse(xml, { status: 200, headers })
  } catch (error) {
    console.error("Error generating product feed:", error)
    return NextResponse.json(
      { error: "Error generating product feed" },
      { status: 500 },
    )
  }
}
