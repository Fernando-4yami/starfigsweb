// src/lib/firebase/admin.ts
import admin from "firebase-admin"

let _initialized = false

function ensureAdmin() {
  if (_initialized) return
  _initialized = true

  if (!admin.apps.length) {
    const storageBucket = "starfigs-29d31"

    // Soporta ambos formatos: base64 o vars individuales
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64

    if (base64) {
      const decoded = Buffer.from(base64, "base64").toString("utf-8")
      const serviceAccount = JSON.parse(decoded)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket,
      })
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket,
      })
    } else {
      throw new Error("❌ Firebase Admin no configurado. Usa FIREBASE_SERVICE_ACCOUNT_BASE64 o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY")
    }
  }
}

export function getStorage() {
  ensureAdmin()
  return admin.storage()
}

export function getDb() {
  ensureAdmin()
  return admin.firestore()
}

export default admin
