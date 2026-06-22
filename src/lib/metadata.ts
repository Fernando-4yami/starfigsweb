import type { Metadata } from "next"
import type { Product } from "@/lib/firebase/products"
import type { SerializedProduct } from "@/lib/serialize-product"

const baseUrl = "https://starfigsperu.com"
const siteName = "Starfigs"

// 🚀 FUNCIÓN PARA PRODUCTOS NORMALES (Product interface)
export function generateProductMetadata(product: Product): Metadata {
  // El nombre del producto va primero para que Google lo use como título exacto
  const title = product.name
  const description = `${product.name} ${product.brand ? `de ${product.brand}` : ""} ${
    product.line ? `línea ${product.line}` : ""
  }. Desde S/. ${product.price.toFixed(2)}. ${product.description_es || product.description || "Figura de anime coleccionable, importada desde Japón."}`

  const imageUrl = product.thumbnailUrl || product.imageUrls?.[0]

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${product.slug}`,
      siteName,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [],
      locale: "es_PE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

// 🆕 FUNCIÓN PARA PRODUCTOS SERIALIZADOS (SerializedProduct interface)
export function generateSerializedProductMetadata(product: SerializedProduct): Metadata {
  // El nombre del producto va primero para que Google lo use como título exacto
  const title = product.name
  const description = `${product.name} ${product.brand ? `de ${product.brand}` : ""} ${
    product.line ? `línea ${product.line}` : ""
  }. Desde S/. ${product.price.toFixed(2)}. ${product.description_es || product.description || "Figura de anime coleccionable, importada desde Japón."}`

  const imageUrl = product.thumbnailUrl || product.imageUrls?.[0]

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${product.slug}`,
      siteName,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [],
      locale: "es_PE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

// 🚀 NUEVA: Metadata para páginas de categoría (Figma, Nendoroid, etc.)
export function generateCategoryMetadata(
  categoryName: string,
  categorySlug: string,
  description: string,
  badge: string,
  productCount?: number,
): Metadata {
  const title = categoryName
  const badgeText = badge?.trim() || ""
  const descParts = [`Compra figuras ${categoryName} originales en Perú.`]
  if (badgeText) descParts.push(badgeText + ".")
  if (productCount) descParts.push(`${productCount} modelos disponibles.`)
  if (description?.trim()) descParts.push(description.trim())
  descParts.push("Envío gratis por Agencias Shalom.")
  const desc = descParts.join(" ")

  return {
    title,
    description: desc.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/categorias/${categorySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/categorias/${categorySlug}`,
      siteName,
      images: [
        {
          url: `${baseUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Starfigs Perú - ${categoryName}`,
        },
      ],
      locale: "es_PE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export function generateLineMetadata(lineName: string, productCount: number): Metadata {
  const title = lineName
  const slug = lineName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const description = `Compra figuras de la línea ${lineName} en Perú. ${productCount} modelos disponibles. Envío gratis por Agencias Shalom.`

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/lines/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/lines/${slug}`,
      siteName,
      images: [
        {
          url: `${baseUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Starfigs Perú - ${lineName}`,
        },
      ],
      locale: "es_PE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

// 🔧 Helper para determinar disponibilidad según stock
// - stock > 0 → InStock (disponible para envío)
// - stock <= 0 o undefined → PreOrder (preventa, se aceptan pedidos)
function getAvailability(stock?: number): string {
  if (stock !== undefined && stock > 0) {
    return "https://schema.org/InStock"
  }
  return "https://schema.org/PreOrder"
}

// 🚀 JSON-LD PARA PRODUCTOS NORMALES (Product interface)
export function generateProductJsonLd(product: Product) {
  const imageUrl = product.imageUrls?.[0] || product.thumbnailUrl || ""

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description_es || product.description || `${product.name} - Figura de anime de alta calidad`,
    sku: product.slug,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(product.gtin ? { gtin: product.gtin } : {}),
    brand: {
      "@type": "Brand",
      name: product.brand || "Sin marca",
    },
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: "PEN",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: getAvailability(product.stock),
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteName,
      },
    },
    category: product.category || "Figura",
    ...(product.heightCm && {
      additionalProperty: {
        "@type": "PropertyValue",
        name: "Altura",
        value: `${product.heightCm} cm`,
      },
    }),
  }
}

// 🆕 JSON-LD PARA PRODUCTOS SERIALIZADOS (SerializedProduct interface)
export function generateSerializedProductJsonLd(product: SerializedProduct) {
  const imageUrl = product.imageUrls?.[0] || product.thumbnailUrl || ""

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description_es || product.description || `${product.name} - Figura de anime de alta calidad`,
    sku: product.slug,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(product.gtin ? { gtin: product.gtin } : {}),
    brand: {
      "@type": "Brand",
      name: product.brand || "Sin marca",
    },
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: "PEN",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: getAvailability(product.stock),
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteName,
      },
    },
    category: product.category || "Figura",
    ...(product.heightCm && {
      additionalProperty: {
        "@type": "PropertyValue",
        name: "Altura",
        value: `${product.heightCm} cm`,
      },
    }),
  }
}

// 🚀 NUEVA: JSON-LD CollectionPage para categorías
export function generateCategoryJsonLd(
  categoryName: string,
  categorySlug: string,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} | Starfigs Perú`,
    description: description.slice(0, 160),
    url: `${baseUrl}/categorias/${categorySlug}`,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: baseUrl,
    },
  }
}

// JSON-LD para la organización / negocio local
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Tienda especializada en figuras de anime y coleccionables importadas desde Japón",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PE",
    },
    sameAs: ["https://www.facebook.com/starfigss", "https://www.instagram.com/starfigs"],
    priceRange: "S/40 - S/5000",
    areaServed: "PE",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Figuras de anime",
      itemListElement: ["Nendoroid", "Figma", "S.H.Figuarts", "Ichiban Kuji", "Pop Up Parade", "Escalas", "Figuras de Premio", "Plushies"],
    },
  }
}

// 🍞 BREADCRUMB JSON-LD
export function generateBreadcrumbJsonLd(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  }
}

// Mapa de slugs de categoría a nombres para breadcrumbs y links
export const CATEGORY_SLUG_TO_NAME: Record<string, string> = {
  nendoroid: "Nendoroid",
  figma: "Figma",
  figuarts: "S.H.Figuarts",
  "ichiban-kuji": "Ichiban Kuji",
  "pop-up-parade": "Pop Up Parade",
  plush: "Plushies",
  scale: "Figuras Escala",
  pricing: "Figuras de Premio",
}

// 🆕 FUNCIONES DE CONVENIENCIA - Auto-detectan el tipo
export function generateAnyProductMetadata(product: Product | SerializedProduct): Metadata {
  if (product.createdAt instanceof Date || product.createdAt === null || product.createdAt === undefined) {
    return generateProductMetadata(product as Product)
  }
  return generateSerializedProductMetadata(product as SerializedProduct)
}

export function generateAnyProductJsonLd(product: Product | SerializedProduct) {
  if (product.createdAt instanceof Date || product.createdAt === null || product.createdAt === undefined) {
    return generateProductJsonLd(product as Product)
  }
  return generateSerializedProductJsonLd(product as SerializedProduct)
}
