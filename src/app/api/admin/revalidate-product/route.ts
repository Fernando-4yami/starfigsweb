import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"

export const dynamic = "force-dynamic"

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request)
  if (!adminAuth.ok) return adminAuth.response

  const payload = await request.json().catch(() => null)
  const slug = typeof payload?.slug === "string" ? payload.slug.trim() : ""

  if (!slug || slug.length > 200 || !VALID_SLUG.test(slug)) {
    return NextResponse.json(
      { error: "Invalid product slug" },
      { status: 400 },
    )
  }

  revalidatePath(`/products/${slug}`)

  return NextResponse.json({
    revalidated: true,
    path: `/products/${slug}`,
  })
}
