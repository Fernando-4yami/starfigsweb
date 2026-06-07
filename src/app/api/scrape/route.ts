import { NextRequest, NextResponse } from "next/server";

import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { uploadImageFromUrlAsWebP } from "@/lib/firebase/upload-image-server";

// Lazy getter para Firebase — solo se inicializa cuando se llama al endpoint
let _db: admin.firestore.Firestore | null = null;

function getDb(): admin.firestore.Firestore {
  if (!_db) {
    if (!getApps().length) {
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

      // Soporta ambos formatos: base64 o vars individuales
      const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

      if (base64) {
        const decoded = Buffer.from(base64, "base64").toString("utf-8");
        const serviceAccount = JSON.parse(decoded);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucket || undefined,
        });
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
          storageBucket: storageBucket || undefined,
        });
      } else {
        throw new Error("Firebase Admin env vars not configured on server");
      }
    }
    _db = admin.firestore();
  }
  return _db;
}

// ─── HELPERS ─────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function determineCategory(data: Record<string, unknown>): string {
  const text = `${data.mediaType || ""} ${data.productLine || ""} ${data.name || ""}`.toLowerCase();
  if (text.includes("plush") || text.includes("peluche")) return "plush";
  if (text.includes("nendoroid")) return "nendoroid";
  if (text.includes("figma")) return "figma";
  if (text.includes("figuarts")) return "figuarts";
  if (text.includes("pop-up") || text.includes("pop up")) return "pop-up-parade";
  if (text.includes("ichiban") || text.includes("kuji")) return "ichiban-kuji";
  if (text.includes("scale") || text.includes("1/")) return "scale";
  return "figura";
}

// ─── API ROUTE ───────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validar campos requeridos
    const name = (data.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "El nombre del producto es requerido" }, { status: 400 });
    }

    const price = 109.00;

    const slug = generateSlug(name);
    const rawImageUrls: string[] = Array.isArray(data.images) ? data.images : [];
    const category = determineCategory(data);

    // 🖼️ Convertir imágenes externas a WebP y subirlas a Firebase Storage
    let imageUrls: string[] = [];
    for (const imgUrl of rawImageUrls) {
      if (!imgUrl || typeof imgUrl !== "string") continue;
      try {
        const webpUrl = await uploadImageFromUrlAsWebP(imgUrl, "products");
        imageUrls.push(webpUrl);
        console.log(`✅ Imagen convertida a WebP: ${webpUrl.slice(0, 80)}...`);
      } catch (err) {
        // Fallback: si falla la conversión, usar la URL original
        console.warn(`⚠️ No se pudo convertir a WebP, usando original: ${imgUrl.slice(0, 80)}...`, err instanceof Error ? err.message : "");
        imageUrls.push(imgUrl);
      }
    }

    // Inicializar Firebase solo cuando se necesita
    const db = getDb();

    // Verificar duplicados por slug y eliminar
    const existingQuery = await db
      .collection("products")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const batch = db.batch();
      existingQuery.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Extraer altura numerica y formatear size como "Xcm aprox."
    // Ej: "Approx. 16 cm" → heightCm = 16, size = "16cm aprox."
    let heightCm: number | null = null;
    let size = "";
    if (data.size) {
      // Requiere al menos un digito ANTES del punto decimal opcional
      // Asi evitamos capturar el punto solitario de palabras como "Approx."
      const numMatch = String(data.size).match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const parsed = parseFloat(numMatch[1]);
        if (!isNaN(parsed)) {
          heightCm = parsed;
          size = `${heightCm}cm aprox.`;
        }
      }
    }

    // Guardar en Firestore (releaseDate = createdAt para que tenga 1 mes antes de mostrar "Agotado")
    const docRef = await db.collection("products").add({
      name,
      slug,
      price,
      description: data.description || "",
      imageUrls,
      brand: data.manufacturer || "",
      line: data.productLine || "",
      size,
      heightCm,
      category,
      views: 0,
      stock: 0,
      releaseDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Producto guardado desde scraper: "${name}" (${docRef.id})`);

    return NextResponse.json({
      success: true,
      result: { id: docRef.id, slug, name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ Error en /api/scrape:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
