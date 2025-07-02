import { storage as adminStorage } from "../../../lib/firebase/admin"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"

/**
 * Uploads an image from a URL, converts it to WebP, and saves it to Firebase Storage.
 */
export async function uploadImageFromUrlAsWebP(imageUrl: string, folder = "products") {
  if (!adminStorage) {
    const errorMessage =
      "Firebase Admin Storage not initialized. Check server logs for Admin SDK initialization errors."
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
    const originalBuffer = Buffer.from(response.data, "binary")

    const webpBuffer = await sharp(originalBuffer).webp({ quality: 80 }).toBuffer()
    const filename = `${folder}/${uuidv4()}.webp`
    const bucket = (adminStorage as any).bucket()
    const file = bucket.file(filename)

    await file.save(webpBuffer, {
      metadata: { contentType: "image/webp" },
      public: true,
    })

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`
    console.log(`Successfully uploaded URL and converted to WebP: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error("Error uploading image from URL or converting to WebP:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to upload image from ${imageUrl}: ${error.message}`)
    }
    throw new Error(`Failed to upload image from ${imageUrl} due to an unknown error.`)
  }
}

/**
 * Uploads an image buffer, converts it to WebP, and saves it to Firebase Storage.
 * NOTA: Esta función procesa el buffer con Sharp
 */
export async function uploadImageBufferAsWebP(imageBuffer: Buffer, originalFileName: string, folder = "products") {
  if (!adminStorage) {
    const errorMessage =
      "Firebase Admin Storage not initialized. Check server logs for Admin SDK initialization errors."
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  try {
    console.log(`Processing ${originalFileName} for WebP conversion and upload.`)
    const webpBuffer = await sharp(imageBuffer).webp({ quality: 80 }).toBuffer()
    const filename = `${folder}/${uuidv4()}.webp`
    const bucket = (adminStorage as any).bucket()
    const file = bucket.file(filename)

    await file.save(webpBuffer, {
      metadata: { contentType: "image/webp" },
      public: true,
    })

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`
    console.log(`Successfully uploaded buffer ${originalFileName} and converted to WebP: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`Error uploading image buffer ${originalFileName} or converting to WebP:`, error)
    if (error instanceof Error) {
      throw new Error(`Failed to upload image buffer ${originalFileName}: ${error.message}`)
    }
    throw new Error(`Failed to upload image buffer ${originalFileName} due to an unknown error.`)
  }
}

/**
 * NUEVA: Sube un buffer ya procesado (sin procesamiento adicional)
 */
export async function uploadProcessedImageBuffer(
  processedBuffer: Buffer,
  originalFileName: string,
  folder = "products",
) {
  if (!adminStorage) {
    const errorMessage =
      "Firebase Admin Storage not initialized. Check server logs for Admin SDK initialization errors."
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  try {
    console.log(`Uploading already processed ${originalFileName}.`)
    const filename = `${folder}/${uuidv4()}.webp`
    const bucket = (adminStorage as any).bucket()
    const file = bucket.file(filename)

    await file.save(processedBuffer, {
      metadata: { contentType: "image/webp" },
      public: true,
    })

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`
    console.log(`Successfully uploaded processed buffer: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`Error uploading processed image buffer:`, error)
    if (error instanceof Error) {
      throw new Error(`Failed to upload processed image buffer: ${error.message}`)
    }
    throw new Error(`Failed to upload processed image buffer due to an unknown error.`)
  }
}
