import { getDb } from "@/lib/firebase/admin"
import type {
  CompactDiscount,
  CompactSearchIndexEntry,
} from "@/lib/search/index-types"
import { compactImageUrl } from "@/lib/search/image-url"
import { normalizeSearchText } from "@/lib/search/normalize"

const SEARCH_FIELDS = [
  "name",
  "slug",
  "price",
  "description",
  "description_es",
  "imageUrls",
  "thumbnailUrl",
  "brand",
  "line",
  "category",
  "createdAt",
  "releaseDate",
  "heightCm",
  "scale",
  "views",
  "discount",
] as const

function toDate(value: any): Date | null {
  if (!value) return null
  if (typeof value.toDate === "function") return value.toDate()

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIso(value: any): string | null {
  return toDate(value)?.toISOString() || null
}

function normalizeDiscount(value: any): CompactDiscount | null {
  if (!value) return null

  return [
    Boolean(value.isActive),
    value.type === "fixed" ? "fixed" : "percentage",
    Number(value.value) || 0,
    toIso(value.startDate),
    toIso(value.endDate),
  ]
}

function createIndexEntry(doc: FirebaseFirestore.QueryDocumentSnapshot): CompactSearchIndexEntry {
  const data = doc.data()
  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : []
  const createdAt = toDate(data.createdAt)
  const name = String(data.name || "")
  const thumbnailUrl = data.thumbnailUrl || null

  return [
    doc.id,
    name,
    String(data.slug || doc.id),
    Number(data.price) || 0,
    compactImageUrl(thumbnailUrl ? null : imageUrls[0]),
    compactImageUrl(thumbnailUrl),
    data.brand || null,
    data.line || null,
    createdAt?.getTime() || 0,
    toIso(data.releaseDate)?.slice(0, 10) || null,
    Number(data.heightCm) || null,
    data.scale || null,
    Number(data.views) || 0,
    normalizeDiscount(data.discount),
    normalizeSearchText(
      [
        name,
        data.description_es || data.description || "",
        data.brand,
        data.line,
        data.category,
        data.scale,
      ].join(" "),
    ),
  ]
}

export async function buildSearchIndex(): Promise<CompactSearchIndexEntry[]> {
  const snapshot = await getDb()
    .collection("products")
    .select(...SEARCH_FIELDS)
    .get()

  return snapshot.docs.map(createIndexEntry)
}
