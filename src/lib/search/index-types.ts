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

export type CompactFeedEntry = [
  id: string,
  name: string,
  slug: string,
  price: number,
  imageUrl: string | null,
  brand: string | null,
  category: string | null,
  stock: number | null,
  gtin: string | null,
  line: string | null,
  scale: string | null,
  releaseDate: string | null,
  description: string | null,
]

export type CompactSitemapEntry = [
  slug: string,
  line: string | null,
  modifiedAtMs: number,
]

export type CompactImageSitemapEntry = [
  slug: string,
  name: string,
  imageUrls: string[],
]

export interface CompactAdminOptions {
  brands: string[]
  lines: string[]
}

export interface CatalogArtifacts {
  searchIndex: CompactSearchIndexEntry[]
  feed: CompactFeedEntry[]
  sitemap: CompactSitemapEntry[]
  imageSitemap: CompactImageSitemapEntry[]
  adminOptions: CompactAdminOptions
}

export interface SearchIndexEntry {
  product: SearchProduct
  searchableText: string
  normalizedName: string
  normalizedBrand: string
  normalizedLine: string
  createdAtMs: number
}
