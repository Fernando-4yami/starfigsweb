import { NextResponse } from "next/server"
import { buildSearchIndex } from "@/lib/search/index-builder"

export const revalidate = 86_400
export const runtime = "nodejs"

export async function GET() {
  try {
    const index = await buildSearchIndex()
    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error("Search index generation failed:", error)
    return NextResponse.json(
      { error: "Unable to generate search index" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
