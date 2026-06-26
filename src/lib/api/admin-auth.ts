import { type NextRequest, NextResponse } from "next/server"
import admin, { getDb } from "@/lib/firebase/admin"

type AdminAuthResult =
  | { ok: true; uid: string; email?: string }
  | { ok: false; response: NextResponse }

function getAllowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("authorization") || ""
  const match = authHeader.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  try {
    getDb()
    const decoded = await admin.auth().verifyIdToken(match[1])
    const allowedEmails = getAllowedEmails()
    const email = decoded.email?.toLowerCase()

    if (process.env.NODE_ENV === "production" && allowedEmails.length === 0) {
      console.error("ADMIN_EMAILS is required for protected admin APIs")
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Admin access is not configured" },
          { status: 500 }
        ),
      }
    }

    if (allowedEmails.length > 0 && (!email || !allowedEmails.includes(email))) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      }
    }

    return { ok: true, uid: decoded.uid, email }
  } catch (error) {
    console.error("Admin auth failed:", error)
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
}
