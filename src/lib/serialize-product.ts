// 🔧 UTILIDADES PARA SERIALIZAR PRODUCTOS DE FIRESTORE

export interface SerializedProduct {
  id: string
  name: string
  slug: string
  price: number
  description?: string
  imageUrls: string[]
  thumbnailUrl?: string
  galleryThumbnailUrls?: string[]
  brand?: string
  line?: string
  createdAt?: string | null // Serializado como ISO string
  releaseDate?: string | null // Serializado como ISO string
  heightCm?: number
  scale?: string
  category?: string
  views?: number
  lastViewedAt?: string | null // Serializado como ISO string
}

// 🚀 SERIALIZAR PRODUCTO PARA PASAR DE SERVER A CLIENT
export function serializeProduct(product: any): SerializedProduct {
  return {
    id: product.id,
    name: product.name || "",
    slug: product.slug || "",
    price: product.price || 0,
    description: product.description,
    imageUrls: product.imageUrls || [],
    thumbnailUrl: product.thumbnailUrl,
    galleryThumbnailUrls: product.galleryThumbnailUrls,
    brand: product.brand,
    line: product.line,
    category: product.category,
    heightCm: product.heightCm,
    scale: product.scale,
    views: product.views,
    // 🔧 SERIALIZAR FECHAS COMO ISO STRINGS
    createdAt: product.createdAt?.toDate?.() ? product.createdAt.toDate().toISOString() : product.createdAt,
    releaseDate: product.releaseDate?.toDate?.() ? product.releaseDate.toDate().toISOString() : product.releaseDate,
    lastViewedAt: product.lastViewedAt?.toDate?.() ? product.lastViewedAt.toDate().toISOString() : product.lastViewedAt,
  }
}

// 🔧 PARSEAR FECHA SERIALIZADA DE VUELTA A DATE
export function parseSerializedDate(dateValue: any): Date | null {
  if (!dateValue) return null

  // Si es string ISO
  if (typeof dateValue === "string") {
    return new Date(dateValue)
  }

  // Si es Timestamp de Firestore
  if (dateValue.toDate && typeof dateValue.toDate === "function") {
    return dateValue.toDate()
  }

  // Si es objeto con seconds (serializado)
  if (dateValue.seconds) {
    return new Date(dateValue.seconds * 1000)
  }

  // Si ya es Date
  if (dateValue instanceof Date) {
    return dateValue
  }

  // Fallback
  return new Date(dateValue)
}
