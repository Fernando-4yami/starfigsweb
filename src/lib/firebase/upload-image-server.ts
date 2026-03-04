// src/lib/firebase/upload-image-server.ts
import { storage as adminStorage } from "./admin"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"

/**
 * ✅ GENERAR URL PÚBLICA SIN TOKEN
 */
function getPublicUrl(bucketName: string, filename: string): string {
  // ✅ URL PÚBLICA SIN TOKEN - Solo funciona si las reglas permiten lectura pública
  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(filename)}`
}

/**
 * Uploads an image from a URL, converts it to WebP, and saves it to Firebase Storage.
 */
export async function uploadImageFromUrlAsWebP(imageUrl: string, folder = "products") {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage not initialized")
  }

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
    const originalBuffer = Buffer.from(response.data, "binary")

    const webpBuffer = await sharp(originalBuffer).webp({ quality: 80 }).toBuffer()
    const filename = `${folder}/${uuidv4()}.webp`
    
    const bucket = adminStorage.bucket("starfigs-29d31")
    const file = bucket.file(filename)

    // ✅ SUBIR CON makePublic() PARA ASEGURAR ACCESO PÚBLICO
    await file.save(webpBuffer, {
      metadata: { 
        contentType: "image/webp",
        cacheControl: 'public, max-age=31536000',
      },
    })

    // ✅ HACER EL ARCHIVO PÚBLICO EXPLÍCITAMENTE
    await file.makePublic()

    const publicUrl = getPublicUrl(bucket.name, filename)
    console.log(`✅ Uploaded from URL: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error("Error uploading image from URL:", error)
    throw new Error(`Failed to upload image from ${imageUrl}: ${error.message}`)
  }
}

/**
 * Uploads an image buffer, converts it to WebP, and saves it to Firebase Storage.
 */
export async function uploadImageBufferAsWebP(
  imageBuffer: Buffer, 
  originalFileName: string, 
  folder = "products"
) {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage not initialized")
  }

  try {
    console.log(`Processing ${originalFileName} for WebP conversion and upload.`)
    const webpBuffer = await sharp(imageBuffer).webp({ quality: 80 }).toBuffer()
    const filename = `${folder}/${uuidv4()}.webp`
    
    const bucket = adminStorage.bucket("starfigs-29d31")
    const file = bucket.file(filename)

    await file.save(webpBuffer, {
      metadata: { 
        contentType: "image/webp",
        cacheControl: 'public, max-age=31536000',
      },
    })

    // ✅ HACER PÚBLICO
    await file.makePublic()

    const publicUrl = getPublicUrl(bucket.name, filename)
    console.log(`✅ Uploaded buffer: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`Error uploading image buffer ${originalFileName}:`, error)
    throw new Error(`Failed to upload image buffer ${originalFileName}: ${error.message}`)
  }
}

/**
 * ✅ Sube un buffer ya procesado (YA ES WebP)
 */
export async function uploadProcessedImageBuffer(
  processedBuffer: Buffer,
  originalFileName: string,
  folder = "products",
) {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage not initialized")
  }

  try {
    console.log(`📤 Uploading already processed: ${originalFileName}`)
    const filename = `${folder}/${uuidv4()}.webp`
    
    const bucket = adminStorage.bucket("starfigs-29d31")
    const file = bucket.file(filename)

    await file.save(processedBuffer, {
      metadata: { 
        contentType: "image/webp",
        cacheControl: 'public, max-age=31536000',
      },
    })

    // ✅ HACER PÚBLICO EXPLÍCITAMENTE
    await file.makePublic()

    const publicUrl = getPublicUrl(bucket.name, filename)
    
    console.log(`✅ Uploaded: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`❌ Error uploading processed buffer:`, error)
    throw new Error(`Failed to upload processed image buffer: ${error.message}`)
  }
}