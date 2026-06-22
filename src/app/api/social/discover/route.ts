import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Se requiere el Page Access Token" }, { status: 400 })
    }

    const API_VERSION = "v20.0"
    const BASE = `https://graph.facebook.com/${API_VERSION}`

    // Step 1: Get user's pages with their Instagram accounts
    const meResp = await fetch(`${BASE}/me/accounts?fields=id,name,username,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`)
    const meData = await meResp.json()

    if (meData.error) {
      return NextResponse.json({
        error: "Token inválido o sin permisos",
        details: meData.error.message,
        hint: "Asegúrate de tener los permisos: pages_manage_posts, pages_read_engagement, instagram_basic",
      }, { status: 401 })
    }

    const pages = (meData.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      username: page.username || null,
      instagram: page.instagram_business_account
        ? {
            id: page.instagram_business_account.id,
            username: page.instagram_business_account.username,
          }
        : null,
    }))

    // Step 2: Validate token scopes
    const tokenResp = await fetch(`${BASE}/debug_token?input_token=${accessToken}&access_token=${accessToken}`)
    const tokenData = await tokenResp.json()
    const scopes = tokenData.data?.scopes || []

    return NextResponse.json({
      success: true,
      pages,
      tokenScopes: scopes,
      hasRequiredPermissions: {
        pagesManagePosts: scopes.includes("pages_manage_posts"),
        pagesReadEngagement: scopes.includes("pages_read_engagement"),
        instagramBasic: scopes.includes("instagram_basic"),
        instagramContentPublish: scopes.includes("instagram_content_publish"),
      },
    })
  } catch (error) {
    console.error("Discover API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
