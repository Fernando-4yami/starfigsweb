import { NextResponse } from "next/server"
import generatedFeed from "@/lib/search/generated-feed.json"
import { expandImageUrl } from "@/lib/search/image-url"
import type { CompactFeedEntry } from "@/lib/search/index-types"

export const revalidate = 86400

const BASE_URL = "https://starfigsperu.com"
const feedEntries = generatedFeed as CompactFeedEntry[]

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getGoogleCategory(category?: string | null): string {
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

export async function GET() {
  try {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Starfigs Peru - Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Figuras de anime originales importadas desde Japon. Preventas, pedidos por encargo y envios a todo el Peru.</description>
`

    for (const entry of feedEntries) {
      const [
        id,
        name,
        slug,
        rawPrice,
        compactImageUrl,
        rawBrand,
        category,
        stock,
        gtin,
        line,
        scale,
        releaseDate,
        rawDescription,
      ] = entry
      const imageUrl = expandImageUrl(compactImageUrl) || ""
      const price = rawPrice > 0 ? rawPrice : 100

      let availability: string
      let availabilityDate = ""
      if (typeof stock === "number" && stock > 0) {
        availability = "in_stock"
      } else if (releaseDate) {
        availability = "preorder"
        availabilityDate = releaseDate.slice(0, 10)
        if (!availabilityDate) availability = "backorder"
      } else {
        availability = "backorder"
      }

      const brand = rawBrand && rawBrand !== "Sin marca" ? rawBrand : "Otros"
      const description =
        rawDescription && rawDescription.length >= 50
          ? rawDescription
          : `${name} - Figura de anime coleccionable 100% original, importada desde Japon. Ideal para tu vitrina o como regalo para fans del anime. Producto en preventa.`
      const productType = category || "figura"

      xml += `    <item>
      <g:id>${xmlEscape(slug || id)}</g:id>
      <g:title>${xmlEscape(name)}</g:title>
      <g:description>${xmlEscape(description.substring(0, 5000))}</g:description>
      <g:link>${BASE_URL}/products/${xmlEscape(slug)}</g:link>
      <g:image_link>${xmlEscape(imageUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>${availabilityDate && availability === "preorder" ? `
      <g:availability_date>${availabilityDate}</g:availability_date>` : ""}
      <g:price>${formatPrice(price)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:product_type>${xmlEscape(productType)}</g:product_type>
      <g:google_product_category>${getGoogleCategory(productType)}</g:google_product_category>`

      if (gtin) {
        xml += `
      <g:gtin>${xmlEscape(gtin)}</g:gtin>`
      } else {
        xml += `
      <g:identifier_exists>false</g:identifier_exists>`
      }

      xml += `
      <g:mpn>${xmlEscape(slug || id)}</g:mpn>`

      if (line) {
        xml += `
      <g:custom_label_0>${xmlEscape(line)}</g:custom_label_0>`
      }

      if (scale) {
        xml += `
      <g:custom_label_1>${xmlEscape(scale)}</g:custom_label_1>`
      }

      xml += `
      <g:custom_label_2>${xmlEscape(productType)}</g:custom_label_2>
    </item>
`
    }

    xml += `  </channel>
</rss>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error("Error generating product feed:", error)
    return NextResponse.json(
      { error: "Error generating product feed" },
      { status: 500 },
    )
  }
}
