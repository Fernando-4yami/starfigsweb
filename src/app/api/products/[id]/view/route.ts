import { type NextRequest, NextResponse } from "next/server"
import admin, { getDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const FIRESTORE_VIEW_WRITES_ENABLED =
  process.env.PRODUCT_VIEW_WRITES_ENABLED === "true"

interface ViewRouteContext {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: ViewRouteContext) {
  const productId = params.id?.trim()

  if (!productId || productId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
  }

  if (!FIRESTORE_VIEW_WRITES_ENABLED) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
        "X-Starfigs-View-Tracking": "disabled",
      },
    })
  }

  try {
    const db = getDb()
    await db.collection("products").doc(productId).update({
      views: admin.firestore.FieldValue.increment(1),
      lastViewedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error: any) {
    if (error?.code === 5 || error?.code === "not-found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.error("Failed to record product view:", error)
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
  }
}
