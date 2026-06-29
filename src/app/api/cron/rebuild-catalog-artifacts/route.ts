import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!deployHookUrl) {
    return NextResponse.json(
      { error: "VERCEL_DEPLOY_HOOK_URL is not configured" },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(deployHookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "starfigs-daily-catalog-rebuild",
        requestedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    })

    const text = await response.text()
    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Deploy hook request failed",
          status: response.status,
          body: text.slice(0, 500),
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Daily catalog rebuild requested",
      status: response.status,
      body: text ? text.slice(0, 500) : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to trigger deploy hook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
