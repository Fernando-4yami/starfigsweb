import { NextResponse } from "next/server"
import searchIndex from "@/lib/search/generated-index.json"

export const revalidate = 86_400

export async function GET() {
  try {
    return NextResponse.json(searchIndex, {
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
