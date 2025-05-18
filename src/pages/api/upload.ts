// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { IncomingForm, Fields, Files } from 'formidable'
import fs from 'fs'

// Para que Next.js no procese el body automáticamente
export const config = {
  api: { bodyParser: false }
}

const firebaseConfig = {
  apiKey: "AIzaSyAXfYj3yO5y0JtL4ocVRvYK7T4lG5QtDv8",
  authDomain: "starfigs-29d31.firebaseapp.com",
  projectId: "starfigs-29d31",
  storageBucket: "starfigs-29d31.firebasestorage.app", // <-- Bucket corregido aquí
  messagingSenderId: "937714963213",
  appId: "1:937714963213:web:279ede7394fc5677811644"
}

// Inicializar Firebase solo si no hay una instancia
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const storage = getStorage(app)

// Función que parsea el FormData con formidable en forma de promesa
const parseForm = (req: NextApiRequest) =>
  new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { files } = await parseForm(req)
    const fileField = files.file
    if (!fileField) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    const file = Array.isArray(fileField) ? fileField[0] : fileField
    const buffer = fs.readFileSync(file.filepath)
    // const safeName = encodeURIComponent(file.originalFilename || 'file')
    // Cambié a ruta fija para probar error
    const pathInStorage = `products/test.png`
    const imageRef = ref(storage, pathInStorage)
    await uploadBytes(imageRef, buffer, {
      contentType: file.mimetype || undefined
    })
    const url = await getDownloadURL(imageRef)
    return res.status(200).json({ url })
  } catch (err) {
    console.error('Error en API /upload:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
