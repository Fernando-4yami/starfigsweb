import { FieldPath } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"
import { getCurrentMonthDateRange } from "@/lib/utils"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
} from "@/lib/api/public-product"

export const revalidate = 21600
const NEW_PRODUCTS_PAGE_SIZE = 18
const CURRENT_RELEASES_PAGE_SIZE = 18

export async function GET() {
  try {
    const collection = getDb().collection("products")
    const {
      start: currentStart,
      end: currentEnd,
      year: currentYear,
      monthIndex: currentMonthIndex,
    } = getCurrentMonthDateRange()

    const [newlyAddedSnapshot, popularSnapshot, currentSnapshot] = await Promise.all([
      collection
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(NEW_PRODUCTS_PAGE_SIZE + 1)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
      collection
        .where("views", ">", 0)
        .orderBy("views", "desc")
        .limit(10)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
      collection
        .where("releaseDate", ">=", currentStart)
        .where("releaseDate", "<=", currentEnd)
        .orderBy("releaseDate", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(CURRENT_RELEASES_PAGE_SIZE + 1)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
    ])

    const newlyAddedDocs = newlyAddedSnapshot.docs.slice(0, NEW_PRODUCTS_PAGE_SIZE)
    const lastNewProduct = newlyAddedDocs.at(-1)
    const lastCreatedAt = lastNewProduct?.data().createdAt
    const newlyAddedHasMore = newlyAddedSnapshot.docs.length > NEW_PRODUCTS_PAGE_SIZE
    const newlyAddedCursor =
      newlyAddedHasMore && lastNewProduct && lastCreatedAt
        ? {
            date:
              typeof lastCreatedAt.toDate === "function"
                ? lastCreatedAt.toDate().toISOString()
                : new Date(lastCreatedAt).toISOString(),
            id: lastNewProduct.id,
          }
        : null

    const currentReleaseDocs = currentSnapshot.docs.slice(0, CURRENT_RELEASES_PAGE_SIZE)
    const lastCurrentRelease = currentReleaseDocs.at(-1)
    const lastReleaseDate = lastCurrentRelease?.data().releaseDate
    const currentReleasesHaveMore =
      currentSnapshot.docs.length > CURRENT_RELEASES_PAGE_SIZE
    const currentReleasesCursor =
      currentReleasesHaveMore && lastCurrentRelease && lastReleaseDate
        ? {
            date:
              typeof lastReleaseDate.toDate === "function"
                ? lastReleaseDate.toDate().toISOString()
                : new Date(lastReleaseDate).toISOString(),
            id: lastCurrentRelease.id,
          }
        : null
    const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}`

    return NextResponse.json(
      {
        newlyAdded: newlyAddedDocs.map(normalizePublicProduct),
        newlyAddedHasMore,
        newlyAddedCursor,
        weeklyPopular: popularSnapshot.docs.map(normalizePublicProduct),
        currReleases: currentReleaseDocs.map(normalizePublicProduct),
        currentReleasesHaveMore,
        currentReleasesCursor,
        currentMonthIndex,
        currentMonthKey,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("Error loading homepage data:", error)
    return NextResponse.json({ error: "Unable to load homepage data" }, { status: 500 })
  }
}
