import { getDb } from "@/lib/firebase/admin"
import type {
  CatalogArtifacts,
  CompactAdminOptions,
  CompactFeedEntry,
  CompactImageSitemapEntry,
  CompactSitemapEntry,
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
  "stock",
  "gtin",
  "updatedAt",
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

function firstNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
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

function createFeedEntry(doc: FirebaseFirestore.QueryDocumentSnapshot): CompactFeedEntry | null {
  const data = doc.data()
  const name = String(data.name || "").trim()
  const slug = String(data.slug || doc.id).trim()
  if (!name || !slug) return null

  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : []
  const imageUrl = firstNonEmpty(data.thumbnailUrl, imageUrls[0])
  const description = firstNonEmpty(data.description_es, data.description)

  return [
    doc.id,
    name,
    slug,
    Number(data.price) || 0,
    compactImageUrl(imageUrl),
    data.brand || null,
    data.category || null,
    typeof data.stock === "number" ? data.stock : null,
    data.gtin || null,
    data.line || null,
    data.scale || null,
    toIso(data.releaseDate),
    description ? description.slice(0, 1200) : null,
  ]
}

function createSitemapEntry(doc: FirebaseFirestore.QueryDocumentSnapshot): CompactSitemapEntry | null {
  const data = doc.data()
  const slug = String(data.slug || "").trim()
  if (!slug) return null

  const modifiedAt = toDate(data.updatedAt) || toDate(data.createdAt) || new Date()

  return [
    slug,
    data.line || null,
    Number.isNaN(modifiedAt.getTime()) ? Date.now() : modifiedAt.getTime(),
  ]
}

function createImageSitemapEntry(doc: FirebaseFirestore.QueryDocumentSnapshot): CompactImageSitemapEntry | null {
  const data = doc.data()
  const slug = String(data.slug || "").trim()
  const name = String(data.name || "").trim()
  if (!slug || !name) return null

  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : []
  const images = [...new Set([data.thumbnailUrl, imageUrls[0]].filter(Boolean))]
    .map(compactImageUrl)
    .filter((value): value is string => Boolean(value))

  if (images.length === 0) return null

  return [slug, name, images]
}

function addOption(set: Set<string>, value: unknown) {
  if (typeof value !== "string") return
  const option = value.trim()
  if (option) set.add(option)
}

export async function buildCatalogArtifacts(): Promise<CatalogArtifacts> {
  const snapshot = await getDb()
    .collection("products")
    .select(...SEARCH_FIELDS)
    .get()

  const searchIndex: CompactSearchIndexEntry[] = []
  const feed: CompactFeedEntry[] = []
  const sitemap: CompactSitemapEntry[] = []
  const imageSitemap: CompactImageSitemapEntry[] = []
  const brands = new Set<string>()
  const lines = new Set<string>()

  snapshot.docs.forEach((doc) => {
    const data = doc.data()

    searchIndex.push(createIndexEntry(doc))
    addOption(brands, data.brand)
    addOption(lines, data.line)

    const feedEntry = createFeedEntry(doc)
    if (feedEntry) feed.push(feedEntry)

    const sitemapEntry = createSitemapEntry(doc)
    if (sitemapEntry) sitemap.push(sitemapEntry)

    const imageEntry = createImageSitemapEntry(doc)
    if (imageEntry) imageSitemap.push(imageEntry)
  })

  const adminOptions: CompactAdminOptions = {
    brands: [...brands].sort((a, b) => a.localeCompare(b, "es")),
    lines: [...lines].sort((a, b) => a.localeCompare(b, "es")),
  }

  return { searchIndex, feed, sitemap, imageSitemap, adminOptions }
}

export async function buildSearchIndex(): Promise<CompactSearchIndexEntry[]> {
  return (await buildCatalogArtifacts()).searchIndex
}
