import { FieldPath, Timestamp } from "firebase-admin/firestore"
import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
} from "@/lib/api/public-product"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed)) return 20
  return Math.min(Math.max(parsed, 8), 40)
}

export async function GET(request: NextRequest) {
  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
    const cursorDate = request.nextUrl.searchParams.get("cursorDate")
    const cursorId = request.nextUrl.searchParams.get("cursorId")

    let query: FirebaseFirestore.Query = getDb()
      .collection("products")
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")

    if (cursorDate && cursorId) {
      const parsedDate = new Date(cursorDate)
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid catalog cursor" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        )
      }

      query = query.startAfter(Timestamp.fromDate(parsedDate), cursorId)
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

    return NextResponse.json(
      {
        products: pageDocs.map(normalizePublicProduct),
        hasMore,
        nextCursor,
      },
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
