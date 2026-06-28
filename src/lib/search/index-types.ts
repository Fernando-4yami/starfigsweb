import type { SearchProduct } from "@/lib/search/types"

export type CompactDiscount = [
  isActive: boolean,
  type: "percentage" | "fixed",
  value: number,
  startDate: string | null,
  endDate: string | null,
]

export type CompactSearchIndexEntry = [
  id: string,
  name: string,
  slug: string,
  price: number,
  imageUrl: string | null,
  thumbnailUrl: string | null,
  brand: string | null,
  line: string | null,
  createdAtMs: number,
  releaseDate: string | null,
  heightCm: number | null,
  scale: string | null,
  views: number,
  discount: CompactDiscount | null,
  searchableText: string,
]

export interface SearchIndexEntry {
  product: SearchProduct
  searchableText: string
  normalizedName: string
  normalizedBrand: string
  normalizedLine: string
  createdAtMs: number
}
