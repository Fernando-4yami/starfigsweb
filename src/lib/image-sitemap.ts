export const PRODUCTS_PER_IMAGE_SITEMAP = 2000

export function getImageSitemapPageCount(productCount: number) {
  return Math.max(1, Math.ceil(productCount / PRODUCTS_PER_IMAGE_SITEMAP))
}
