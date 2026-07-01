import { FieldPath, Timestamp } from "firebase-admin/firestore"
import { unstable_cache } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
} from "@/lib/api/public-product"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type CatalogPage = {
  products: ReturnType<typeof normalizePublicProduct>[]
  hasMore: boolean
  nextCursor: { date: string; id: string } | null
}

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed)) return 20
  return Math.min(Math.max(parsed, 8), 40)
}

async function loadCatalogPage(
  limit: number,
  cursorDate: string | null,
  cursorId: string | null,
): Promise<CatalogPage> {
  let query: FirebaseFirestore.Query = getDb()
    .collection("products")
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "desc")

  if (cursorDate && cursorId) {
    query = query.startAfter(Timestamp.fromDate(new Date(cursorDate)), cursorId)
  }

  const snapshot = await query
    .limit(limit + 1)
    .select(...PUBLIC_PRODUCT_FIELDS)
    .get()

  const hasMore = snapshot.docs.length > limit
  const pageDocs = snapshot.docs.slice(0, limit)
  const lastDoc = pageDocs.at(-1)
  const lastCreatedAt = lastDoc?.data().createdAt
  const nextCursor =
    hasMore && lastDoc && lastCreatedAt
      ? {
          date:
            typeof lastCreatedAt.toDate === "function"
              ? lastCreatedAt.toDate().toISOString()
              : new Date(lastCreatedAt).toISOString(),
          id: lastDoc.id,
        }
      : null

  return {
    products: pageDocs.map(normalizePublicProduct),
    hasMore,
    nextCursor,
  }
}

const getCachedCatalogPage = unstable_cache(
  loadCatalogPage,
  ["catalog-page-v1"],
  { revalidate: 21600 },
)

function getMonthRange(monthKey: string) {
  const match = MONTH_KEY_PATTERN.exec(monthKey)
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1

  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1) - 1),
  }
}

async function loadReleasePage(
  limit: number,
  monthKey: string,
  cursorDate: string | null,
  cursorId: string | null,
): Promise<CatalogPage> {
  const monthRange = getMonthRange(monthKey)
  if (!monthRange) throw new Error("Invalid release month")

  let query: FirebaseFirestore.Query = getDb()
    .collection("products")
    .where("releaseDate", ">=", monthRange.start)
    .where("releaseDate", "<=", monthRange.end)
    .orderBy("releaseDate", "desc")
    .orderBy(FieldPath.documentId(), "desc")

  if (cursorDate && cursorId) {
    query = query.startAfter(Timestamp.fromDate(new Date(cursorDate)), cursorId)
  }

  const snapshot = await query
    .limit(limit + 1)
    .select(...PUBLIC_PRODUCT_FIELDS)
    .get()

  const hasMore = snapshot.docs.length > limit
  const pageDocs = snapshot.docs.slice(0, limit)
  const lastDoc = pageDocs.at(-1)
  const lastReleaseDate = lastDoc?.data().releaseDate
  const nextCursor =
    hasMore && lastDoc && lastReleaseDate
      ? {
          date:
            typeof lastReleaseDate.toDate === "function"
              ? lastReleaseDate.toDate().toISOString()
              : new Date(lastReleaseDate).toISOString(),
          id: lastDoc.id,
        }
      : null

  return {
    products: pageDocs.map(normalizePublicProduct),
    hasMore,
    nextCursor,
  }
}

const getCachedReleasePage = unstable_cache(
  loadReleasePage,
  ["release-page-v1"],
  { revalidate: 21600 },
)

export async function GET(request: NextRequest) {
  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
    const cursorDate = request.nextUrl.searchParams.get("cursorDate")
    const cursorId = request.nextUrl.searchParams.get("cursorId")
    const mode = request.nextUrl.searchParams.get("mode") || "catalog"
    const monthKey = request.nextUrl.searchParams.get("month")

    if (cursorDate && cursorId) {
      const parsedDate = new Date(cursorDate)
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid catalog cursor" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        )
      }
    }

    if (mode !== "catalog" && mode !== "releases") {
      return NextResponse.json(
        { error: "Invalid catalog mode" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    if (mode === "releases" && (!monthKey || !getMonthRange(monthKey))) {
      return NextResponse.json(
        { error: "Invalid or missing release month" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    const payload =
      mode === "releases"
        ? await getCachedReleasePage(limit, monthKey!, cursorDate, cursorId)
        : await getCachedCatalogPage(limit, cursorDate, cursorId)

    return NextResponse.json(
      payload,
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("Error loading catalog:", error)
    return NextResponse.json(
      { error: "Unable to load catalog" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
