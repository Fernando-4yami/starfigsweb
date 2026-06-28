import { type NextRequest, NextResponse } from "next/server"
import { getSearchSuggestions, searchCatalog } from "@/lib/search/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
}

function parseInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function getSearchIndexOrigin(request: NextRequest): string {
  const hostname = request.nextUrl.hostname.toLowerCase()
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return request.nextUrl.origin
  }

  return (process.env.NEXT_PUBLIC_BASE_URL || "https://starfigsperu.com").replace(/\/+$/, "")
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || ""
  const mode = request.nextUrl.searchParams.get("mode") || "products"

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json(
      { error: "Search query must contain between 2 and 100 characters" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  if (mode !== "products" && mode !== "suggestions") {
    return NextResponse.json(
      { error: "Invalid search mode" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const indexOrigin = getSearchIndexOrigin(request)

    if (mode === "suggestions") {
      const limit = parseInteger(request.nextUrl.searchParams.get("limit"), 8, 1, 10)
      const suggestions = await getSearchSuggestions(query, limit, indexOrigin)
      return NextResponse.json({ suggestions }, { headers: CACHE_HEADERS })
    }

    const page = parseInteger(request.nextUrl.searchParams.get("page"), 1, 1, 500)
    const limit = parseInteger(request.nextUrl.searchParams.get("limit"), 20, 1, 40)
    const result = await searchCatalog(query, page, limit, indexOrigin)
    return NextResponse.json(result, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error("Search request failed:", error)
    return NextResponse.json(
      { error: "Unable to search products" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
