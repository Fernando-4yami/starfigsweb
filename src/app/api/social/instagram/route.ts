import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { igAccountId, accessToken, caption, imageUrl } = await request.json()

    if (!igAccountId || !accessToken || !caption || !imageUrl) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: igAccountId, accessToken, caption, imageUrl" },
        { status: 400 }
      )
    }

    const API_VERSION = "v20.0"
    const BASE = `https://graph.facebook.com/${API_VERSION}/${igAccountId}`

    // Step 1: Create media container
    const containerResp = await fetch(`${BASE}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    })
    const containerData = await containerResp.json()

    if (!containerData.id) {
      return NextResponse.json(
        { error: "Error al crear el contenedor multimedia", details: containerData },
        { status: 500 }
      )
    }

    // esperar 3 segundos para que se procese el contenedor
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Step 2: Publicar el contenedor
    const publishResp = await fetch(`${BASE}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    })
    const publishData = await publishResp.json()

    if (publishData.id) {
      return NextResponse.json({
        success: true,
        postId: publishData.id,
        permalink: `https://instagram.com/p/${publishData.id}`,
      })
    }

    return NextResponse.json(
      { error: "Error al publicar en Instagram", details: publishData },
      { status: 500 }
    )
  } catch (error) {
    console.error("Instagram API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
