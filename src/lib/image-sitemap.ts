import { unstable_cache } from "next/cache"
import { FieldPath } from "firebase-admin/firestore"
import { getDb } from "@/lib/firebase/admin"

export const PRODUCTS_PER_IMAGE_SITEMAP = 2000

async function loadImageSitemapProductIds(): Promise<string[]> {
  const snapshot = await getDb()
    .collection("products")
    .orderBy(FieldPath.documentId())
    .select()
    .get()

  return snapshot.docs.map((doc) => doc.id)
}

export const getCachedImageSitemapProductIds = unstable_cache(
  loadImageSitemapProductIds,
  ["image-sitemap-product-ids-v1"],
  { revalidate: 86400 },
)

export function getImageSitemapPageCount(productCount: number) {
  return Math.max(1, Math.ceil(productCount / PRODUCTS_PER_IMAGE_SITEMAP))
}
