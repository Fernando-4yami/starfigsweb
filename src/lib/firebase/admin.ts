// src/lib/firebase/admin.ts
import admin from 'firebase-admin'

// Verificar variables de entorno
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error('❌ FIREBASE_PROJECT_ID no está configurado')
  throw new Error('FIREBASE_PROJECT_ID is required')
}

if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error('❌ FIREBASE_STORAGE_BUCKET no está configurado')
  throw new Error('FIREBASE_STORAGE_BUCKET is required')
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ FIREBASE_CLIENT_EMAIL no está configurado')
  throw new Error('FIREBASE_CLIENT_EMAIL is required')
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ FIREBASE_PRIVATE_KEY no está configurado')
  throw new Error('FIREBASE_PRIVATE_KEY is required')
}

// Inicializar Firebase Admin SDK (solo una vez)
if (!admin.apps.length) {
  try {
    console.log('🔧 Inicializando Firebase Admin SDK...')
    console.log('📦 Project ID:', process.env.FIREBASE_PROJECT_ID)
    console.log('🪣 Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET)
    console.log('📧 Client Email:', process.env.FIREBASE_CLIENT_EMAIL)
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
    
    console.log('✅ Firebase Admin SDK inicializado correctamente')
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin SDK:', error)
    throw error
  }
}

// Exportar instancias del Admin SDK
export const storage = admin.storage()
export const db = admin.firestore()
export default admin