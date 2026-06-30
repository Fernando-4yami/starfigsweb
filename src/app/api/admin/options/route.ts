import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import adminOptions from "@/lib/search/generated-admin-options.json"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request)
  if (!adminAuth.ok) return adminAuth.response

  return NextResponse.json(adminOptions, {
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  })
}
