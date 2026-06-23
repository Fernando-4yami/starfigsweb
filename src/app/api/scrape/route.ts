import { NextRequest, NextResponse } from "next/server";

// ─── Lazy initializers ───────────────────────────
// Los imports se hacen dentro del handler para evitar errores 500 en Vercel
// durante la carga del módulo (sharp y firebase-admin son modulos nativos pesados)

let _admin: any = null;
let _sharp: any = null;

async function getAdmin() {
  if (!_admin) {
    const mod = await import("firebase-admin");
    const { getApps } = await import("firebase-admin/app");
    _admin = mod;

    if (!getApps().length) {
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

      if (base64) {
        const decoded = Buffer.from(base64, "base64").toString("utf-8");
        const serviceAccount = JSON.parse(decoded);
        _admin.initializeApp({
          credential: _admin.credential.cert(serviceAccount),
          storageBucket: storageBucket || undefined,
        });
      } else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        _admin.initializeApp({
          credential: _admin.credential.cert({
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
  }
  return _admin;
}

async function getSharp() {
  if (!_sharp) {
    const mod = await import("sharp");
    _sharp = mod.default || mod;
  }
  return _sharp;
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
    const imageUrls = Array.isArray(data.images) ? data.images : [];
    const category = determineCategory(data);

    // Inicializar Firebase (lazy — secuencial para evitar race condition)
    const admin = await getAdmin();
    const db = admin.firestore();

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
    let heightCm: number | null = null;
    let size = "";
    if (data.size) {
      const numMatch = String(data.size).match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const parsed = parseFloat(numMatch[1]);
        if (!isNaN(parsed)) {
          heightCm = parsed;
          size = `${heightCm}cm aprox.`;
        }
      }
    }

    // Guardar en Firestore
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

    // ========== GENERAR THUMBNAIL (200px WebP) ==========
    if (imageUrls.length > 0) {
      try {
        const sharp = await getSharp();
        const response = await fetch(imageUrls[0])
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        const originalBuffer = Buffer.from(arrayBuffer)

        const thumbBuffer = await sharp(originalBuffer)
          .resize(200, 200, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 90 })
          .toBuffer()

        const bucket = admin.storage().bucket("starfigs-29d31")
        const filename = `products/thumb_${docRef.id}_scrape.webp`
        const file = bucket.file(filename)

        await file.save(thumbBuffer, {
          metadata: {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000, immutable",
          },
        })
        await file.makePublic()

        const thumbnailUrl = `https://storage.googleapis.com/starfigs-29d31/${encodeURIComponent(filename)}`
        await docRef.update({ thumbnailUrl })
        console.log(`✅ Thumbnail generado: ${thumbnailUrl}`)
      } catch (err) {
        console.warn(`⚠️ No se pudo generar thumbnail para "${name}":`, err instanceof Error ? err.message : err)
      }
    }

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
