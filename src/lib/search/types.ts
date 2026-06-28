import type { SerializedProduct } from "@/lib/serialize-product"

export type SearchProduct = Pick<
  SerializedProduct,
  | "id"
  | "name"
  | "slug"
  | "price"
  | "imageUrls"
  | "thumbnailUrl"
  | "brand"
  | "line"
  | "category"
  | "createdAt"
  | "releaseDate"
  | "heightCm"
  | "scale"
  | "views"
  | "stock"
  | "lowStockThreshold"
  | "discount"
>

export interface ProductSearchResponse {
  products: SearchProduct[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SuggestionSearchResponse {
  suggestions: string[]
}
