import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const revalidate = 43200 // 12 horas - Google cachea el feed

const BASE_URL = "https://starfigsperu.com"

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getGoogleCategory(category?: string): string {
  const map: Record<string, string> = {
    figura: "6006",    // Collectibles
    nendoroid: "6006",
    figma: "6006",
    "pop-up-parade": "6006",
    "ichiban-kuji": "6006",
    scale: "6006",
    plush: "2121",     // Plush Toys / Stuffed Animals
    figuarts: "6006",
    pricing: "6006",
  }
  if (!category) return "6006"
  const lower = category.toLowerCase().trim()
  return map[lower] || "6006"
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} PEN`
}

export async function GET() {
  try {
    const db = getDb()

    // Traer todos los productos con los campos necesarios
    const snapshot = await db
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
        "heightCm",
        "releaseDate",
      )
      .get()

    const products: any[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      // Incluir productos con nombre (el precio se asigna default más abajo)
      if (data.name) {
        products.push({
          id: doc.id,
          ...data,
        })
      }
    })

    console.log(`📦 Feed Google: ${products.length} productos listos`)

    // Generar XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Starfigs Perú - Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Figuras de anime originales importadas desde Japón. Preventas, pedidos por encargo y envíos a todo el Perú.</description>
`

    for (const product of products) {
      const imageUrl = product.imageUrls?.[0] || product.thumbnailUrl || ""
      const name = product.name || ""
      const slug = product.slug || ""
      // 🔧 DEFAULT PRICE: S/100 para productos sin precio (solo en el feed, no toca frontend)
      const hasPrice = product.price !== undefined && product.price !== null && product.price > 0
      const price = hasPrice ? product.price : 100
      const stock = product.stock
      const releaseDate = product.releaseDate

      // Determinar disponibilidad según las reglas de Google:
      // - stock > 0 → in_stock (disponible para envío inmediato) — no requiere availability_date
      // - stock ≤ 0 + releaseDate → preorder + availability_date (obligatorio)
      // - stock ≤ 0 sin releaseDate → backorder (preventa sin fecha) — no requiere availability_date
      let availability: string
      let availabilityDate = ""
      if (stock !== undefined && stock > 0) {
        availability = "in_stock"
      } else if (releaseDate) {
        availability = "preorder"
        try {
          const date = typeof releaseDate.toDate === "function"
            ? releaseDate.toDate()
            : new Date(releaseDate)
          if (!isNaN(date.getTime())) {
            availabilityDate = date.toISOString().split("T")[0]
          }
        } catch {
          // ignorar fechas inválidas
        }
        // 🔥 FIX: Google REQUIERE availability_date para preorder.
        // Si no pudimos generar una fecha válida, caemos a backorder
        // para que Google no lo rechace.
        if (!availabilityDate) {
          availability = "backorder"
        }
      } else {
        availability = "backorder"
      }

      // 🔧 DEFAULT BRAND: Si no tiene marca o está como "Sin marca", usar "Otros"
      const rawBrand = (product.brand || "").trim()
      const brand = rawBrand && rawBrand !== "Sin marca" ? rawBrand : "Otros"

      // 🔧 DEFAULT DESCRIPTION: Google requiere > 50 caracteres
      const rawDesc = (product.description_es || product.description || "").trim()
      const description = rawDesc.length >= 50
        ? rawDesc
        : `${name} - Figura de anime coleccionable 100% original, importada desde Japón. Ideal para tu vitrina o como regalo para fans del anime. Producto en preventa.`
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
        // Sin GTIN → declarar que el producto no tiene código de barras (figuras de colección)
        xml += `
      <g:identifier_exists>false</g:identifier_exists>`
      }

      // MPN con el slug como identificador alternativo
      xml += `
      <g:mpn>${xmlEscape(slug)}</g:mpn>`

      // Línea de producto como custom label (útil para campañas)
      if (product.line) {
        xml += `
      <g:custom_label_0>${xmlEscape(product.line)}</g:custom_label_0>`
      }

      // Escala como custom label
      if (product.scale) {
        xml += `
      <g:custom_label_1>${xmlEscape(product.scale)}</g:custom_label_1>`
      }

      // Categoría como custom label
      xml += `
      <g:custom_label_2>${xmlEscape(category)}</g:custom_label_2>`

      xml += `
    </item>
`
    }

    xml += `  </channel>
</rss>`

    // Cache en el CDN de Firebase Hosting
    const headers = new Headers()
    headers.set("Content-Type", "application/xml; charset=utf-8")
    headers.set("Cache-Control", "public, max-age=43200, s-maxage=43200, stale-while-revalidate=86400")

    return new NextResponse(xml, { status: 200, headers })
  } catch (error) {
    console.error("❌ Error generando feed:", error)
    return NextResponse.json(
      { error: "Error generando feed de productos" },
      { status: 500 },
    )
  }
}
