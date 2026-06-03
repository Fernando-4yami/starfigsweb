import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";

const db = admin.firestore();

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

function parsePrice(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "number") return Math.round(raw * 100) / 100;
  const cleaned = String(raw).replace(/[^0-9.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
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

function parseReleaseDate(raw: unknown): Date | null {
  if (!raw) return null;
  const d = new Date(String(raw));
  return isNaN(d.getTime()) ? null : d;
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

    const price = parsePrice(data.price);
    if (price <= 0) {
      return NextResponse.json({ error: "El precio debe ser mayor a 0" }, { status: 400 });
    }

    const slug = generateSlug(name);
    const imageUrls = Array.isArray(data.images) ? data.images : [];
    const category = determineCategory(data);
    const releaseDate = parseReleaseDate(data.releaseDate);

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

    // Guardar en Firestore
    const docRef = await db.collection("products").add({
      name,
      slug,
      price,
      description: data.description || "",
      imageUrls,
      brand: data.manufacturer || "",
      line: data.productLine || "",
      category,
      releaseDate: releaseDate ? admin.firestore.Timestamp.fromDate(releaseDate) : null,
      views: 0,
      stock: 0,
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
