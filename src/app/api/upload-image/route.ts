// src/app/api/upload-image/route.ts
export const dynamic = "force-dynamic"; // ← CRÍTICO: Esto evita que Next.js cachee el endpoint
export const runtime = "nodejs"; // ← Asegura que use Node.js runtime

import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadProcessedImageBuffer } from "@/lib/firebase/upload-image-server"

// 🎯 CONFIGURACIÓN OPTIMIZADA
const IMAGE_CONFIG = {
  original: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 75,
    targetSizeKB: 70,
  },
  thumbnail: {
    width: 300,
    height: 300,
    quality: 70,
    targetSizeKB: 15,
  },
  galleryThumbnail: {
    width: 100,
    height: 100,
    quality: 65,
    targetSizeKB: 5,
  },
}

// 🔧 FUNCIÓN PARA OPTIMIZAR TAMAÑO ITERATIVAMENTE
async function optimizeImageSize(
  buffer: Buffer,
  targetSizeKB: number,
  maxWidth: number,
  maxHeight: number,
  initialQuality = 75,
): Promise<Buffer> {
  let quality = initialQuality
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    try {
      const optimizedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer()

      const sizeKB = optimizedBuffer.length / 1024

      console.log(`📏 Intento ${attempts + 1}: ${Math.round(sizeKB)}KB con calidad ${quality}`)

      if (sizeKB <= targetSizeKB + 10) {
        console.log(`✅ Tamaño optimizado: ${Math.round(sizeKB)}KB`)
        return optimizedBuffer
      }

      quality = Math.max(quality - 10, 30)
      attempts++
    } catch (error) {
      console.error(`❌ Error en optimización intento ${attempts + 1}:`, error)
      throw error
    }
  }

  // Fallback: retornar con la última calidad
  return await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 30 })
    .toBuffer()
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [upload-image] Iniciando proceso de upload...")

    // 1. Validar formData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("❌ Error parseando formData:", error)
      return NextResponse.json(
        {
          error: "Invalid form data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      )
    }

    // 2. Validar file
    const file = formData.get("file") as File
    if (!file) {
      console.error("❌ No file provided")
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const isFirstImage = formData.get("isFirstImage") === "true"
    console.log(`📦 Procesando archivo: ${file.name}`)
    console.log(`🔍 isFirstImage: ${isFirstImage}`)

    // 3. Leer archivo
    let arrayBuffer: ArrayBuffer
    let originalBuffer: Buffer
    try {
      arrayBuffer = await file.arrayBuffer()
      originalBuffer = Buffer.from(arrayBuffer)
      console.log(`📏 Tamaño archivo original: ${originalBuffer.length} bytes`)
    } catch (error) {
      console.error("❌ Error leyendo archivo:", error)
      return NextResponse.json(
        {
          error: "Failed to read file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    // 4. Generar blur placeholder
    let blurPlaceholder: string
    try {
      console.log("🌅 Generando blur placeholder...")
      const blurBuffer = await sharp(originalBuffer)
        .resize(20, 20, { fit: "inside" })
        .webp({ quality: 20 })
        .toBuffer()

      blurPlaceholder = `data:image/webp;base64,${blurBuffer.toString("base64")}`
      console.log(`✅ Blur placeholder generado`)
    } catch (error) {
      console.error("❌ Error generando blur placeholder:", error)
      return NextResponse.json(
        {
          error: "Failed to generate blur placeholder",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    let imageUrl: string
    let thumbnailUrl: string | undefined
    let galleryThumbnailUrl: string

    try {
      if (isFirstImage) {
        console.log("🖼️ PRIMERA IMAGEN: generando 3 versiones...")

        // Original
        console.log("📤 Procesando versión ORIGINAL...")
        const originalOptimized = await optimizeImageSize(
          originalBuffer,
          IMAGE_CONFIG.original.targetSizeKB,
          IMAGE_CONFIG.original.maxWidth,
          IMAGE_CONFIG.original.maxHeight,
          IMAGE_CONFIG.original.quality,
        )
        imageUrl = await uploadProcessedImageBuffer(originalOptimized, `${file.name}_original`)
        console.log(`✅ ORIGINAL subida: ${imageUrl}`)

        // Thumbnail
        console.log("📤 Procesando THUMBNAIL (300px)...")
        const thumbnailOptimized = await optimizeImageSize(
          originalBuffer,
          IMAGE_CONFIG.thumbnail.targetSizeKB,
          IMAGE_CONFIG.thumbnail.width,
          IMAGE_CONFIG.thumbnail.height,
          IMAGE_CONFIG.thumbnail.quality,
        )
        thumbnailUrl = await uploadProcessedImageBuffer(thumbnailOptimized, `${file.name}_thumb`)
        console.log(`✅ THUMBNAIL subida: ${thumbnailUrl}`)

        // Gallery Thumbnail
        console.log("📤 Procesando GALLERY THUMBNAIL (100px)...")
        const galleryThumbOptimized = await optimizeImageSize(
          originalBuffer,
          IMAGE_CONFIG.galleryThumbnail.targetSizeKB,
          IMAGE_CONFIG.galleryThumbnail.width,
          IMAGE_CONFIG.galleryThumbnail.height,
          IMAGE_CONFIG.galleryThumbnail.quality,
        )
        galleryThumbnailUrl = await uploadProcessedImageBuffer(galleryThumbOptimized, `${file.name}_gallery_thumb`)
        console.log(`✅ GALLERY THUMBNAIL subida: ${galleryThumbnailUrl}`)

      } else {
        console.log("📤 Procesando imagen adicional (NO primera)...")

        // Original
        const originalOptimized = await optimizeImageSize(
          originalBuffer,
          IMAGE_CONFIG.original.targetSizeKB,
          IMAGE_CONFIG.original.maxWidth,
          IMAGE_CONFIG.original.maxHeight,
          IMAGE_CONFIG.original.quality,
        )
        imageUrl = await uploadProcessedImageBuffer(originalOptimized, `${file.name}_original`)

        // Gallery Thumbnail
        const galleryThumbOptimized = await optimizeImageSize(
          originalBuffer,
          IMAGE_CONFIG.galleryThumbnail.targetSizeKB,
          IMAGE_CONFIG.galleryThumbnail.width,
          IMAGE_CONFIG.galleryThumbnail.height,
          IMAGE_CONFIG.galleryThumbnail.quality,
        )
        galleryThumbnailUrl = await uploadProcessedImageBuffer(galleryThumbOptimized, `${file.name}_gallery_thumb`)

        console.log("✅ Imagen adicional procesada")
      }

      // 5. Retornar respuesta exitosa
      const response = {
        success: true,
        imageUrl,
        thumbnailUrl,
        galleryThumbnailUrl,
        blurPlaceholder,
        isFirstImage,
        message: `Image uploaded successfully`,
      }

      console.log("🎉 [upload-image] Proceso completado exitosamente")
      return NextResponse.json(response, { status: 200 })

    } catch (uploadError) {
      console.error("❌ Error durante upload/procesamiento:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to process/upload image",
          details: uploadError instanceof Error ? uploadError.message : "Unknown error",
          fileName: file.name,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    // ⚠️ CATCH FINAL: Cualquier error no manejado
    console.error("❌ ERROR CRÍTICO en /api/upload-image:", error)
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}