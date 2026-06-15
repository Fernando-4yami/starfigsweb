// src/app/api/diag/route.ts
// 🩺 Endpoint de diagnóstico para verificar dependencias en Vercel
// ⚠️ Usamos import() dinámico para poder capturar errores de carga de módulos
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      FIREBASE_SERVICE_ACCOUNT_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? "✅ configurado" : "❌ NO CONFIGURADO",
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "✅ configurado" : "❌ NO CONFIGURADO",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅ configurado" : "❌ NO CONFIGURADO",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅ configurado" : "❌ NO CONFIGURADO",
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ configurado" : "❌ NO CONFIGURADO",
    },
    tests: {} as Record<string, any>,
  }

  // Test 1: Sharp
  try {
    const sharp = (await import("sharp")).default
    const buf = await sharp({ create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } } })
      .webp({ quality: 80 })
      .toBuffer()
    results.tests.sharp = { status: "✅ OK", size: `${buf.length} bytes` }
  } catch (e: any) {
    results.tests.sharp = { status: "❌ FAIL", error: e.message }
  }

  // Test 2: Firebase Admin
  try {
    const admin = await import("firebase-admin")
    const { getApps } = await import("firebase-admin/app")
    
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64

    if (!base64 && (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
      results.tests.firebaseAdmin = { status: "❌ FAIL", error: "No hay credenciales configuradas" }
    } else {
      if (!getApps().length) {
        let credential
        if (base64) {
          const sa = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"))
          credential = admin.credential.cert(sa)
        } else {
          credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          })
        }
        admin.initializeApp({ credential, storageBucket: "starfigs-29d31" })
      }
      results.tests.firebaseAdmin = { status: "✅ OK" }

      // Test 3: Storage bucket access
      try {
        const bucket = admin.storage().bucket("starfigs-29d31")
        const [meta] = await bucket.getMetadata()
        results.tests.storageBucket = { status: "✅ OK", name: meta.name }
      } catch (e: any) {
        results.tests.storageBucket = { status: "❌ FAIL", error: e.message }
      }

      // Test 4: Firestore access
      try {
        const db = admin.firestore()
        const snap = await db.collection("products").limit(1).get()
        results.tests.firestore = { status: "✅ OK", docs: snap.size }
      } catch (e: any) {
        results.tests.firestore = { status: "❌ FAIL", error: e.message }
      }
    }
  } catch (e: any) {
    results.tests.firebaseAdmin = { status: "❌ FAIL", error: e.message }
  }

  return NextResponse.json(results, { status: Object.values(results.tests).some((t: any) => t.status?.includes("❌")) ? 500 : 200 })
}
