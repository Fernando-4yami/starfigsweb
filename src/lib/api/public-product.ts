export const PUBLIC_PRODUCT_FIELDS = [
  "name",
  "slug",
  "price",
  "thumbnailUrl",
  "imageUrls",
  "brand",
  "line",
  "category",
  "createdAt",
  "releaseDate",
  "heightCm",
  "scale",
  "views",
] as const

function toDate(value: any): Date | null {
  if (!value) return null
  if (typeof value.toDate === "function") return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizePublicProduct(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data()
  const imageUrls: string[] = data.imageUrls || []

  return {
    id: doc.id,
    name: data.name || "",
    slug: data.slug || doc.id,
    price: Number(data.price) || 0,
    thumbnailUrl: data.thumbnailUrl || undefined,
    imageUrls: !data.thumbnailUrl && imageUrls.length > 0 ? [imageUrls[0]] : [],
    brand: data.brand || undefined,
    line: data.line || undefined,
    category: data.category || undefined,
    createdAt: toDate(data.createdAt)?.toISOString() || null,
    releaseDate: toDate(data.releaseDate)?.toISOString() || null,
    heightCm: data.heightCm || undefined,
    scale: data.scale || undefined,
    views: Number(data.views) || 0,
  }
}

export type PublicProduct = ReturnType<typeof normalizePublicProduct>
