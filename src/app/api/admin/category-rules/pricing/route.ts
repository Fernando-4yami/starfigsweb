import { revalidatePath, revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import admin, { getDb } from "@/lib/firebase/admin"
import { requireAdmin } from "@/lib/api/admin-auth"

export const dynamic = "force-dynamic"

function parseLines(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const uniqueLines = new Map<string, string>()
  value.forEach((line) => {
    if (typeof line !== "string") return
    const trimmed = line.trim()
    if (!trimmed || trimmed.length > 160) return
    const key = trimmed.toLocaleLowerCase("es")
    if (!uniqueLines.has(key)) uniqueLines.set(key, trimmed)
  })

  return [...uniqueLines.values()].slice(0, 100)
}

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request)
  if (!adminAuth.ok) return adminAuth.response

  const payload = await request.json().catch(() => null)
  const lines = parseLines(payload?.lines)

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "No valid product lines were provided" },
      { status: 400 },
    )
  }

  await getDb()
    .collection("categoryRules")
    .doc("pricing")
    .set(
      {
        lines: admin.firestore.FieldValue.arrayUnion(...lines),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminAuth.email || adminAuth.uid,
      },
      { merge: true },
    )

  revalidateTag("category-products")
  revalidatePath("/api/categories/pricing")
  revalidatePath("/categorias/pricing")

  return NextResponse.json({
    success: true,
    submittedLines: lines,
  })
}
