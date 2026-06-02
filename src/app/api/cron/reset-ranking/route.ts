import { NextRequest, NextResponse } from "next/server"
import admin, { getDb } from "@/lib/firebase/admin"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 min timeout para 20k+ productos

export async function GET(request: NextRequest) {
  // 🔐 Validar el cron secret
  const authHeader = request.headers.get("authorization")
  const expectedKey = process.env.CRON_SECRET

  if (!expectedKey) {
    console.error("❌ CRON_SECRET no configurado en variables de entorno")
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET not set" },
      { status: 500 },
    )
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  console.log("🔄 Iniciando reset automático del ranking...")

  try {
    // Leer todos los productos
    const snapshot = await getDb().collection("products").get()

    if (snapshot.empty) {
      console.log("⚠️ No hay productos para resetear")
      return NextResponse.json({
        success: true,
        updated: 0,
        message: "No products found",
        duration: `${Date.now() - startTime}ms`,
      })
    }

    // Resetear en batches de 500 (Firestore max batch size)
    const batchSize = 500
    const totalDocs = snapshot.size
    let processed = 0

    const docs = snapshot.docs
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = getDb().batch()
      const chunk = docs.slice(i, i + batchSize)

      chunk.forEach((doc) => {
        batch.update(doc.ref, {
          views: 0,
          lastViewedAt: null,
          lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()
      processed += chunk.length
      console.log(`📦 Batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(totalDocs / batchSize)}: ${processed}/${totalDocs} productos`)
    }

    const duration = Date.now() - startTime
    console.log(`✅ Reset completado: ${processed} productos en ${duration}ms`)

    return NextResponse.json({
      success: true,
      updated: processed,
      total: totalDocs,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en reset del ranking:", error)
    return NextResponse.json(
      {
        error: String(error),
        success: false,
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 },
    )
  }
}
