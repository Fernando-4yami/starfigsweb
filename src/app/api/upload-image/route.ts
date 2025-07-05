import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadProcessedImageBuffer } from "@/lib/firebase/upload-image-server"

// 🎯 CONFIGURACIÓN OPTIMIZADA PARA ~70KB
const IMAGE_CONFIG = {
  original: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 75, // Reducido de 80 a 75
    targetSizeKB: 70,
  },
  thumbnail: {
    width: 300,
    height: 300,
    quality: 70, // Reducido para mantener ~15KB
    targetSizeKB: 15,
  },
  galleryThumbnail: {
    width: 100,
    height: 100,
    quality: 65, // Reducido para mantener ~5KB
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
  const currentBuffer = buffer
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    const optimizedBuffer = await sharp(currentBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer()

    const sizeKB = optimizedBuffer.length / 1024

    console.log(`📏 Intento ${attempts + 1}: ${Math.round(sizeKB)}KB con calidad ${quality}`)

    // Si está dentro del rango objetivo (±10KB), usar este
    if (sizeKB <= targetSizeKB + 10) {
      console.log(`✅ Tamaño optimizado: ${Math.round(sizeKB)}KB`)
      return optimizedBuffer
    }

    // Reducir calidad para el siguiente intento
    quality = Math.max(quality - 10, 30) // No bajar de 30% calidad
    attempts++
  }

  // Si no se logró el tamaño objetivo, devolver el último intento
  console.log(`⚠️ No se pudo alcanzar ${targetSizeKB}KB, usando último intento`)
  return currentBuffer
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const isFirstImage = formData.get("isFirstImage") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`🔍 DEBUG: isFirstImage = ${isFirstImage}`)
    console.log(`🔍 DEBUG: file name = ${file.name}`)

    const arrayBuffer = await file.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)

    console.log(`📏 DEBUG: Tamaño archivo original: ${originalBuffer.length} bytes`)

    // 🌅 Generar blur placeholder
    console.log("🌅 Generando blur placeholder...")
    const blurBuffer = await sharp(originalBuffer).resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer()

    const blurPlaceholder = `data:image/webp;base64,${blurBuffer.toString("base64")}`
    console.log(`✅ Blur placeholder generado (${blurPlaceholder.length} chars)`)

    let imageUrl: string
    let thumbnailUrl: string | undefined
    let galleryThumbnailUrl: string

    if (isFirstImage) {
      console.log("🖼️ PROCESANDO PRIMERA IMAGEN: generando 3 versiones...")

      // 📤 ORIGINAL optimizada
      console.log("📤 Procesando versión ORIGINAL...")
      const originalOptimized = await optimizeImageSize(
        originalBuffer,
        IMAGE_CONFIG.original.targetSizeKB,
        IMAGE_CONFIG.original.maxWidth,
        IMAGE_CONFIG.original.maxHeight,
        IMAGE_CONFIG.original.quality,
      )

      console.log(`📏 DEBUG: Tamaño original optimizado: ${originalOptimized.length} bytes`)
      console.log(`Uploading already processed ${file.name}_original.`)
      imageUrl = await uploadProcessedImageBuffer(originalOptimized, `${file.name}_original`)
      console.log(`✅ ORIGINAL subida: ${imageUrl}`)

      // 🖼️ THUMBNAIL optimizado
      console.log("📤 Procesando THUMBNAIL para product cards (300px)...")
      const thumbnailOptimized = await optimizeImageSize(
        originalBuffer,
        IMAGE_CONFIG.thumbnail.targetSizeKB,
        IMAGE_CONFIG.thumbnail.width,
        IMAGE_CONFIG.thumbnail.height,
        IMAGE_CONFIG.thumbnail.quality,
      )

      console.log(`📏 DEBUG: Tamaño thumbnail optimizado: ${thumbnailOptimized.length} bytes`)
      console.log(`Uploading already processed ${file.name}_thumb.`)
      thumbnailUrl = await uploadProcessedImageBuffer(thumbnailOptimized, `${file.name}_thumb`)
      console.log(`✅ THUMBNAIL (300px) subida: ${thumbnailUrl}`)

      // 🔍 GALLERY THUMBNAIL optimizado
      console.log("📤 Procesando GALLERY THUMBNAIL (100px)...")
      const galleryThumbOptimized = await optimizeImageSize(
        originalBuffer,
        IMAGE_CONFIG.galleryThumbnail.targetSizeKB,
        IMAGE_CONFIG.galleryThumbnail.width,
        IMAGE_CONFIG.galleryThumbnail.height,
        IMAGE_CONFIG.galleryThumbnail.quality,
      )

      console.log(`📏 DEBUG: Tamaño gallery thumbnail optimizado: ${galleryThumbOptimized.length} bytes`)
      console.log(`Uploading already processed ${file.name}_gallery_thumb.`)
      galleryThumbnailUrl = await uploadProcessedImageBuffer(galleryThumbOptimized, `${file.name}_gallery_thumb`)
      console.log(`✅ GALLERY THUMBNAIL (100px) subida: ${galleryThumbnailUrl}`)

      console.log("🎉 PRIMERA IMAGEN COMPLETADA:")
      console.log(`  📸 Original (vista principal): ${imageUrl}`)
      console.log(`  🖼️ Thumbnail (product cards): ${thumbnailUrl}`)
      console.log(`  🔍 Gallery Thumbnail (galería): ${galleryThumbnailUrl}`)
      console.log(`  🌅 Blur Placeholder: ${blurPlaceholder.substring(0, 50)}...`)
    } else {
      console.log("📤 Procesando imagen adicional (NO es primera)...")

      // Para imágenes adicionales, solo original y gallery thumbnail optimizados
      const originalOptimized = await optimizeImageSize(
        originalBuffer,
        IMAGE_CONFIG.original.targetSizeKB,
        IMAGE_CONFIG.original.maxWidth,
        IMAGE_CONFIG.original.maxHeight,
        IMAGE_CONFIG.original.quality,
      )

      console.log(`Uploading already processed ${file.name}_original.`)
      imageUrl = await uploadProcessedImageBuffer(originalOptimized, `${file.name}_original`)

      const galleryThumbOptimized = await optimizeImageSize(
        originalBuffer,
        IMAGE_CONFIG.galleryThumbnail.targetSizeKB,
        IMAGE_CONFIG.galleryThumbnail.width,
        IMAGE_CONFIG.galleryThumbnail.height,
        IMAGE_CONFIG.galleryThumbnail.quality,
      )

      console.log(`Uploading already processed ${file.name}_gallery_thumb.`)
      galleryThumbnailUrl = await uploadProcessedImageBuffer(galleryThumbOptimized, `${file.name}_gallery_thumb`)

      console.log("✅ Imagen adicional procesada:")
      console.log(`  📸 Original: ${imageUrl}`)
      console.log(`  🔍 Gallery Thumbnail: ${galleryThumbnailUrl}`)
      console.log(`  🌅 Blur Placeholder: ${blurPlaceholder.substring(0, 50)}...`)
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      galleryThumbnailUrl,
      blurPlaceholder,
      isFirstImage,
      message: `Image uploaded and processed successfully. Original: ~${Math.round(originalBuffer.length / 1024)}KB optimized`,
    })
  } catch (error) {
    console.error("❌ ERROR COMPLETO en /api/upload-image:", error)
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
