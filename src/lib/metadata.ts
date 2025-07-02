import type { Metadata } from "next"
import type { Product } from "@/lib/firebase/products"
import type { SerializedProduct } from "@/lib/serialize-product"

const baseUrl = "https://starfigsperu.com" // 🔧 Cambia por tu dominio real
const siteName = "Starfigs"

// 🚀 FUNCIÓN PARA PRODUCTOS NORMALES (Product interface)
export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} - ${siteName}`
  const description = `${product.name} ${product.brand ? `de ${product.brand}` : ""} ${
    product.line ? `línea ${product.line}` : ""
  }. Precio: S/. ${product.price.toFixed(2)}. ${product.description || "Figura de anime de alta calidad."}`

  const imageUrl = product.thumbnailUrl || product.imageUrls?.[0]

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${product.slug}`,
      siteName,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 300,
              height: 300,
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
  const title = `${product.name} - ${siteName}`
  const description = `${product.name} ${product.brand ? `de ${product.brand}` : ""} ${
    product.line ? `línea ${product.line}` : ""
  }. Precio: S/. ${product.price.toFixed(2)}. ${product.description || "Figura de anime de alta calidad."}`

  const imageUrl = product.thumbnailUrl || product.imageUrls?.[0]

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${product.slug}`,
      siteName,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 300,
              height: 300,
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

export function generateLineMetadata(lineName: string, products: Product[]): Metadata {
  const title = `${lineName} - Figuras y Coleccionables | ${siteName}`
  const description = `Descubre todas las figuras de la línea ${lineName}. ${products.length} productos disponibles. Las mejores figuras de anime y coleccionables.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/lines/${encodeURIComponent(lineName.toLowerCase().replace(/\s+/g, "-"))}`,
      siteName,
      locale: "es_PE",
      type: "website",
    },
  }
}

// 🚀 JSON-LD PARA PRODUCTOS NORMALES (Product interface)
export function generateProductJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} - Figura de anime de alta calidad`,
    image: product.thumbnailUrl || product.imageUrls?.[0],
    brand: {
      "@type": "Brand",
      name: product.brand || "Sin marca",
    },
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: "PEN",
      availability: "https://schema.org/InStock",
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
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} - Figura de anime de alta calidad`,
    image: product.thumbnailUrl || product.imageUrls?.[0],
    brand: {
      "@type": "Brand",
      name: product.brand || "Sin marca",
    },
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: "PEN",
      availability: "https://schema.org/InStock",
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

// JSON-LD para la organización
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Tienda especializada en figuras de anime y coleccionables",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PE",
    },
    sameAs: ["https://www.facebook.com/starfigs", "https://www.instagram.com/starfigs"],
  }
}

// 🆕 FUNCIONES DE CONVENIENCIA - Auto-detectan el tipo
export function generateAnyProductMetadata(product: Product | SerializedProduct): Metadata {
  // Si tiene createdAt como Date, es Product normal
  if (product.createdAt instanceof Date || product.createdAt === null || product.createdAt === undefined) {
    return generateProductMetadata(product as Product)
  }
  // Si createdAt es string, es SerializedProduct
  return generateSerializedProductMetadata(product as SerializedProduct)
}

export function generateAnyProductJsonLd(product: Product | SerializedProduct) {
  // Si tiene createdAt como Date, es Product normal
  if (product.createdAt instanceof Date || product.createdAt === null || product.createdAt === undefined) {
    return generateProductJsonLd(product as Product)
  }
  // Si createdAt es string, es SerializedProduct
  return generateSerializedProductJsonLd(product as SerializedProduct)
}
