export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadProcessedImageBuffer } from "@/lib/firebase/upload-image-server"

// Función para generar blur placeholder
async function generateBlurPlaceholder(buffer: Buffer): Promise<string> {
  const blurBuffer = await sharp(buffer).resize(20, 20, { fit: "inside" }).blur(1).webp({ quality: 20 }).toBuffer()

  return `data:image/webp;base64,${blurBuffer.toString("base64")}`
}

// Función para procesar una imagen individual
async function processImage(file: File, isFirstImage: boolean) {
  const bytes = await file.arrayBuffer()
  const originalBuffer = Buffer.from(bytes)

  console.log(`📤 Procesando ${file.name} (Primera: ${isFirstImage})`)

  // Generar blur placeholder
  const blurPlaceholder = await generateBlurPlaceholder(originalBuffer)

  if (isFirstImage) {
    // Primera imagen: 3 versiones
    const [originalWebP, thumbnailWebP, galleryThumbWebP] = await Promise.all([
      sharp(originalBuffer).webp({ quality: 90 }).toBuffer(),
      sharp(originalBuffer)
        .resize(300, null, { withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 85 })
        .toBuffer(),
      sharp(originalBuffer)
        .resize(100, 100, { withoutEnlargement: true, fit: "cover", position: "center" })
        .webp({ quality: 80 })
        .toBuffer(),
    ])

    const [originalUrl, thumbnailUrl, galleryThumbnailUrl] = await Promise.all([
      uploadProcessedImageBuffer(originalWebP, `${file.name}_original`, "products"),
      uploadProcessedImageBuffer(thumbnailWebP, `${file.name}_thumb`, "products"),
      uploadProcessedImageBuffer(galleryThumbWebP, `${file.name}_gallery_thumb`, "products"),
    ])

    return {
      imageUrl: originalUrl,
      thumbnailUrl,
      galleryThumbnailUrl,
      blurPlaceholder,
      isFirstImage: true,
      fileName: file.name,
    }
  } else {
    // Imágenes adicionales: 2 versiones
    const [originalWebP, galleryThumbWebP] = await Promise.all([
      sharp(originalBuffer).webp({ quality: 85 }).toBuffer(),
      sharp(originalBuffer)
        .resize(100, 100, { withoutEnlargement: true, fit: "cover", position: "center" })
        .webp({ quality: 80 })
        .toBuffer(),
    ])

    const [imageUrl, galleryThumbnailUrl] = await Promise.all([
      uploadProcessedImageBuffer(originalWebP, `${file.name}_original`, "products"),
      uploadProcessedImageBuffer(galleryThumbWebP, `${file.name}_gallery_thumb`, "products"),
    ])

    return {
      imageUrl,
      galleryThumbnailUrl,
      blurPlaceholder,
      isFirstImage: false,
      fileName: file.name,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 })
    }

    console.log(`📦 BATCH UPLOAD: Procesando ${files.length} archivos`)

    // Procesar todas las imágenes en paralelo
    const results = await Promise.all(files.map((file, index) => processImage(file, index === 0)))

    console.log(`🎉 BATCH UPLOAD COMPLETADO: ${results.length} imágenes procesadas`)

    return NextResponse.json(
      {
        success: true,
        images: results,
        totalProcessed: results.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("❌ ERROR en batch upload:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: "Failed to batch upload images.",
        details: message,
      },
      { status: 500 },
    )
  }
}
