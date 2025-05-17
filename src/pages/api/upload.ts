// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { initializeApp, getApps } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import * as formidable from 'formidable'
import fs from 'fs'

// Permitir manejo de archivos sin bodyParser
export const config = {
  api: { bodyParser: false }
}

// Tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXfYj3yO5y0JtL4ocVRvYK7T4lG5QtDv8",
  authDomain: "starfigs-29d31.firebaseapp.com",
  projectId: "starfigs-29d31",
  storageBucket: "starfigs-29d31.appspot.com",
  messagingSenderId: "937714963213",
  appId: "1:937714963213:web:279ede7394fc5677811644"
};

// Inicializar Firebase si aún no está inicializado
if (!getApps().length) initializeApp(firebaseConfig);
const storage = getStorage();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error al parsear el formulario:", err);
      return res.status(500).json({ error: 'Parsing error' });
    }

    const incomingFiles = files as { [key: string]: formidable.File | formidable.File[] };
    const fileData = incomingFiles.file;

    if (!fileData) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const file = Array.isArray(fileData) ? fileData[0] : fileData;

    try {
      const data = fs.readFileSync(file.filepath);
      const imageRef = ref(storage, `products/${Date.now()}_${file.originalFilename}`);
      await uploadBytes(imageRef, data);
      const url = await getDownloadURL(imageRef);
      res.status(200).json({ url });
    } catch (uploadErr) {
      console.error("Error al subir a Firebase:", uploadErr);
      res.status(500).json({ error: 'Error al subir imagen' });
    }
  });
}
