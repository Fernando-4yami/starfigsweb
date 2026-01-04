// src/lib/firebase/admin.ts
import admin from "firebase-admin"

if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error("❌ FIREBASE_SERVICE_ACCOUNT_BASE64 no está configurado")
  }

  const serviceAccount = JSON.parse(
    Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf-8")
  )

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "starfigs-29d31",
  })
}

export const storage = admin.storage()
export const db = admin.firestore()
export default admin
