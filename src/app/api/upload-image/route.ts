import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadProcessedImageBuffer } from "@/lib/firebase/upload-image-server"

// Función para generar blur placeholder
async function generateBlurPlaceholder(buffer: Buffer): Promise<string> {
  const blurBuffer = await sharp(buffer).resize(20, 20, { fit: "inside" }).blur(1).webp({ quality: 20 }).toBuffer()

  return `data:image/webp;base64,${blurBuffer.toString("base64")}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const isFirstImage = formData.get("isFirstImage") === "true"

    console.log(`🔍 DEBUG: isFirstImage = ${isFirstImage}`)
    console.log(`🔍 DEBUG: file name = ${file?.name}`)

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    // Convertir el archivo a Buffer
    const bytes = await file.arrayBuffer()
    const originalBuffer = Buffer.from(bytes)

    console.log(`📏 DEBUG: Tamaño archivo original: ${originalBuffer.length} bytes`)

    // 🆕 Generar blur placeholder para todas las imágenes
    console.log("🌅 Generando blur placeholder...")
    const blurPlaceholder = await generateBlurPlaceholder(originalBuffer)
    console.log(`✅ Blur placeholder generado (${blurPlaceholder.length} chars)`)

    if (isFirstImage) {
      console.log("🖼️ PROCESANDO PRIMERA IMAGEN: generando 3 versiones...")

      // 1. Versión original (solo convertir a WebP, mantener tamaño)
      console.log("📤 Procesando versión ORIGINAL...")
      const originalWebP = await sharp(originalBuffer).webp({ quality: 90 }).toBuffer()
      console.log(`📏 DEBUG: Tamaño original WebP: ${originalWebP.length} bytes`)
      const originalUrl = await uploadProcessedImageBuffer(originalWebP, `${file.name}_original`, "products")
      console.log(`✅ ORIGINAL subida: ${originalUrl}`)

      // 2. Versión thumbnail para PRODUCT CARDS (300px) - SOLO PRIMERA IMAGEN
      console.log("📤 Procesando THUMBNAIL para product cards (300px)...")
      const thumbnailWebP = await sharp(originalBuffer)
        .resize(300, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
        .webp({ quality: 85 })
        .toBuffer()
      console.log(`📏 DEBUG: Tamaño thumbnail WebP: ${thumbnailWebP.length} bytes`)
      const thumbnailUrl = await uploadProcessedImageBuffer(thumbnailWebP, `${file.name}_thumb`, "products")
      console.log(`✅ THUMBNAIL (300px) subida: ${thumbnailUrl}`)

      // 3. Versión GALLERY THUMBNAIL (100px cuadrada)
      console.log("📤 Procesando GALLERY THUMBNAIL (100px)...")
      const galleryThumbWebP = await sharp(originalBuffer)
        .resize(100, 100, {
          withoutEnlargement: true,
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 80 })
        .toBuffer()
      console.log(`📏 DEBUG: Tamaño gallery thumbnail WebP: ${galleryThumbWebP.length} bytes`)
      const galleryThumbnailUrl = await uploadProcessedImageBuffer(
        galleryThumbWebP,
        `${file.name}_gallery_thumb`,
        "products",
      )
      console.log(`✅ GALLERY THUMBNAIL (100px) subida: ${galleryThumbnailUrl}`)

      console.log(`🎉 PRIMERA IMAGEN COMPLETADA:`)
      console.log(`   📸 Original (vista principal): ${originalUrl}`)
      console.log(`   🖼️ Thumbnail (product cards): ${thumbnailUrl}`)
      console.log(`   🔍 Gallery Thumbnail (galería): ${galleryThumbnailUrl}`)
      console.log(`   🌅 Blur Placeholder: ${blurPlaceholder.slice(0, 50)}...`)

      return NextResponse.json(
        {
          imageUrl: originalUrl,
          thumbnailUrl: thumbnailUrl,
          galleryThumbnailUrl: galleryThumbnailUrl,
          blurPlaceholder, // 🆕 Añadir blur placeholder
          isFirstImage: true,
        },
        { status: 200 },
      )
    } else {
      console.log("📤 Procesando imagen adicional (NO es primera)...")

      // 1. Original
      const originalWebP = await sharp(originalBuffer).webp({ quality: 85 }).toBuffer()
      const imageUrl = await uploadProcessedImageBuffer(originalWebP, `${file.name}_original`, "products")

      // 2. Gallery thumbnail (100px cuadrada)
      const galleryThumbWebP = await sharp(originalBuffer)
        .resize(100, 100, {
          withoutEnlargement: true,
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 80 })
        .toBuffer()
      const galleryThumbnailUrl = await uploadProcessedImageBuffer(
        galleryThumbWebP,
        `${file.name}_gallery_thumb`,
        "products",
      )

      console.log(`✅ Imagen adicional procesada:`)
      console.log(`   📸 Original: ${imageUrl}`)
      console.log(`   🔍 Gallery Thumbnail: ${galleryThumbnailUrl}`)
      console.log(`   🌅 Blur Placeholder: ${blurPlaceholder.slice(0, 50)}...`)

      return NextResponse.json(
        {
          imageUrl,
          galleryThumbnailUrl,
          blurPlaceholder, // 🆕 Añadir blur placeholder
          isFirstImage: false,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("❌ ERROR COMPLETO en /api/upload-image:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: "Failed to upload image.", details: message }, { status: 500 })
  }
}
