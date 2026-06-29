import { type NextRequest, NextResponse } from "next/server"
import admin, { getDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

const RESET_LIMIT = 500

function getAuthorizationError(request: NextRequest): NextResponse | null {
  const expectedKey = process.env.CRON_SECRET
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET not set" },
      { status: 500 },
    )
  }

  if (request.headers.get("authorization") !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}

export async function GET(request: NextRequest) {
  const authorizationError = getAuthorizationError(request)
  if (authorizationError) return authorizationError

  const startedAt = Date.now()

  try {
    const db = getDb()
    const snapshot = await db
      .collection("products")
      .where("views", ">", 0)
      .orderBy("views", "desc")
      .limit(RESET_LIMIT)
      .select("views")
      .get()

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        updated: 0,
        hasMore: false,
        message: "No ranked products to reset",
        durationMs: Date.now() - startedAt,
      })
    }

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        views: 0,
        lastViewedAt: null,
        lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      updated: snapshot.size,
      hasMore: snapshot.size === RESET_LIMIT,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Ranking reset failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    )
  }
}
