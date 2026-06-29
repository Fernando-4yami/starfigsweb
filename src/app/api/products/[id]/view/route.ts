import { type NextRequest, NextResponse } from "next/server"
import admin, { getDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const FIRESTORE_VIEW_WRITES_ENABLED =
  process.env.PRODUCT_VIEW_WRITES_ENABLED !== "false"
const MIN_VIEW_DWELL_MS = Math.max(
  Number(process.env.PRODUCT_VIEW_MIN_DWELL_MS || "9000"),
  1000,
)

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|preview|curl|wget|python|httpclient|axios|postman|headless/i

interface ViewRouteContext {
  params: { id: string }
}

function noContent(reason?: string) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      ...(reason ? { "X-Starfigs-View-Tracking": reason } : {}),
    },
  })
}

function hasAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true

  const host = request.headers.get("host")
  const allowedOrigins = new Set([
    "https://starfigsperu.com",
    "https://www.starfigsperu.com",
    host ? `https://${host}` : "",
    host ? `http://${host}` : "",
  ])

  return allowedOrigins.has(origin)
}

async function getReportedDwellMs(request: NextRequest) {
  try {
    const payload = await request.json()
    return Number(payload?.dwellMs) || 0
  } catch {
    return 0
  }
}

export async function POST(request: NextRequest, { params }: ViewRouteContext) {
  const productId = params.id?.trim()

  if (!productId || productId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
  }

  if (!FIRESTORE_VIEW_WRITES_ENABLED) {
    return noContent("disabled")
  }

  try {
    const userAgent = request.headers.get("user-agent") || ""
    if (!userAgent || BOT_USER_AGENT_PATTERN.test(userAgent)) {
      return noContent("skipped-bot")
    }

    if (!hasAllowedOrigin(request)) {
      return noContent("skipped-origin")
    }

    const dwellMs = await getReportedDwellMs(request)
    if (dwellMs < MIN_VIEW_DWELL_MS) {
      return noContent("skipped-dwell")
    }

    const db = getDb()
    await db.collection("products").doc(productId).update({
      views: admin.firestore.FieldValue.increment(1),
      lastViewedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return noContent("recorded")
  } catch (error: any) {
    if (error?.code === 5 || error?.code === "not-found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.error("Failed to record product view:", error)
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
  }
}
