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
  stock?: number
  lowStockThreshold?: number
  discount?: {
    isActive: boolean
    type: "percentage" | "fixed"
    value: number
    startDate?: string | null
    endDate?: string | null
  }
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
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    discount: product.discount
      ? {
          isActive: product.discount.isActive,
          type: product.discount.type,
          value: product.discount.value,
          startDate: product.discount.startDate?.toDate?.()
            ? product.discount.startDate.toDate().toISOString()
            : product.discount.startDate,
          endDate: product.discount.endDate?.toDate?.()
            ? product.discount.endDate.toDate().toISOString()
            : product.discount.endDate,
        }
      : undefined,
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

// 🔧 VERIFICAR SI EL PRODUCTO TIENE STOCK DISPONIBLE
export function isInStock(product: SerializedProduct | any): boolean {
  return (product.stock ?? 0) > 0
}

// 🔧 VERIFICAR SI EL PRODUCTO TIENE DESCUENTO ACTIVO
export function hasActiveDiscount(product: SerializedProduct | any): boolean {
  if (!product.discount || !product.discount.isActive) return false

  const now = new Date()

  // Verificar fecha de inicio
  if (product.discount.startDate) {
    const startDate = parseSerializedDate(product.discount.startDate)
    if (startDate && now < startDate) return false
  }

  // Verificar fecha de fin
  if (product.discount.endDate) {
    const endDate = parseSerializedDate(product.discount.endDate)
    if (endDate && now > endDate) return false
  }

  return true
}

// 🔧 CALCULAR PRECIO FINAL CON DESCUENTO
export function calculateFinalPrice(product: SerializedProduct | any): number {
  if (!hasActiveDiscount(product)) return product.price

  const discount = product.discount
  if (discount.type === "percentage") {
    return product.price * (1 - discount.value / 100)
  } else {
    return Math.max(0, product.price - discount.value)
  }
}

// 🔧 OBTENER PORCENTAJE DE DESCUENTO
export function getDiscountPercentage(product: SerializedProduct | any): number {
  if (!hasActiveDiscount(product)) return 0

  const discount = product.discount
  if (discount.type === "percentage") {
    return discount.value
  } else {
    // Calcular porcentaje equivalente para descuento fijo
    return Math.round((discount.value / product.price) * 100)
  }
}
