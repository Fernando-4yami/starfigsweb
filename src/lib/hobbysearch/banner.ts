import generatedBanner from "@/lib/hobbysearch/generated-banner.json"

export interface HobbySearchBannerItem {
  sourceId: string
  jan: string
  productName: string
  productSlug: string
  imagePath: string
  imagePath2x?: string
  width: number
  height: number
  matchMethod: "gtin" | "title-fallback"
}

function isValidBannerItem(value: unknown): value is HobbySearchBannerItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<HobbySearchBannerItem>

  return Boolean(
    item.sourceId &&
      /^\d+$/.test(item.sourceId) &&
      item.jan &&
      /^\d{8,14}$/.test(item.jan) &&
      item.productName &&
      item.productSlug &&
      /^[a-z0-9-]+$/.test(item.productSlug) &&
      item.imagePath?.startsWith("/banners/hobbysearch/") &&
      (!item.imagePath2x ||
        item.imagePath2x.startsWith("/banners/hobbysearch/")) &&
      typeof item.width === "number" &&
      item.width > 0 &&
      typeof item.height === "number" &&
      item.height > 0 &&
      (item.matchMethod === "gtin" ||
        item.matchMethod === "title-fallback"),
  )
}

export const hobbySearchBannerItems = generatedBanner.items.filter(
  isValidBannerItem,
)
