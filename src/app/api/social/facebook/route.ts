import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pageId, accessToken, message, imageUrls } = await request.json()

    if (!pageId || !accessToken || !message || !imageUrls?.length) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: pageId, accessToken, message, imageUrls" },
        { status: 400 }
      )
    }

    const API_VERSION = "v20.0"
    const BASE = `https://graph.facebook.com/${API_VERSION}/${pageId}`
    const mediaIds: string[] = []
    const errors: string[] = []

    // Step 1: Upload each image as unpublished
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const resp = await fetch(`${BASE}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrls[i],
            published: false,
            temporary: true,
            access_token: accessToken,
          }),
        })
        const data = await resp.json()
        if (data.id) {
          mediaIds.push(data.id)
        } else {
          errors.push(`Imagen ${i + 1}: ${data.error?.message || "error desconocido"}`)
        }
      } catch (err) {
        errors.push(`Imagen ${i + 1}: error de conexión`)
      }
    }

    if (mediaIds.length === 0) {
      return NextResponse.json(
        { error: "No se pudo subir ninguna imagen", details: errors },
        { status: 500 }
      )
    }

    // Step 2: Create post with all uploaded media
    const postResp = await fetch(`${BASE}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        attached_media: mediaIds.map((id) => ({ media_fbid: id })),
        access_token: accessToken,
      }),
    })
    const postData = await postResp.json()

    if (postData.id) {
      return NextResponse.json({
        success: true,
        postId: postData.id,
        mediaCount: mediaIds.length,
        postUrl: `https://facebook.com/${postData.id}`,
      })
    }

    return NextResponse.json(
      { error: "Error al crear la publicación", details: postData },
      { status: 500 }
    )
  } catch (error) {
    console.error("Facebook API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
