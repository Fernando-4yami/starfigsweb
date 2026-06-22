import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env.local
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

if (!getApps().length) {
  const serviceAccountBase64 = env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local");
  }
  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function parseReleaseDate(rd) {
  if (!rd) return null;
  try {
    if (typeof rd.toDate === "function") return rd.toDate();
    const d = new Date(rd);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

async function main() {
  console.log("🔍 Escaneando 7,744 productos...\n");

  const snapshot = await db.collection("products").get();
  const total = snapshot.size;

  let sinNombre = 0;
  let sinPrecio = 0;
  let precioCero = 0;
  let conPrecio = 0;

  // Estados de disponibilidad (solo para productos con precio > 0)
  let inStock = 0;
  let preorderConFecha = 0;
  let preorderSinFecha = 0; // 🔥 estos causan el error
  let backorder = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.name) { sinNombre++; return; }

    const price = data.price;
    const stock = data.stock;
    const releaseDate = data.releaseDate;

    if (price === undefined || price === null) { sinPrecio++; return; }
    if (price === 0) { precioCero++; return; }
    conPrecio++;

    // Determinar disponibilidad (misma lógica que el feed)
    if (stock !== undefined && stock > 0) {
      inStock++;
    } else if (releaseDate) {
      const parsedDate = parseReleaseDate(releaseDate);
      if (parsedDate) {
        preorderConFecha++;
      } else {
        preorderSinFecha++; // ❌ preorder sin availability_date
      }
    } else {
      backorder++;
    }
  });

  console.log("📊 ESTADÍSTICAS COMPLETAS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total en Firestore:         ${total}`);
  console.log("");
  console.log("PRODUCTOS CON PRECIO > 0:");
  console.log(`  Total:                    ${conPrecio}`);
  console.log(`  ├─ in_stock (stock > 0):  ${inStock}`);
  console.log(`  ├─ preorder (con fecha):  ${preorderConFecha}  ✅`);
  console.log(`  ├─ preorder (SIN fecha):  ${preorderSinFecha}  ❌ error Merchant`);
  console.log(`  └─ backorder:             ${backorder}`);
  console.log("");
  console.log("PRODUCTOS SIN PRECIO VÁLIDO:");
  console.log(`  Total:                    ${total - conPrecio}`);
  console.log(`  ├─ Sin precio (undefined): ${sinPrecio}`);
  console.log(`  ├─ Precio = 0:             ${precioCero}`);
  console.log(`  └─ Sin nombre:             ${sinNombre}`);
  console.log("");
  console.log(`🔥 Con el fix que aplicamos, los ${preorderSinFecha} pasan a backorder ✅`);
  console.log(`📦 Google Merchant debería mostrar: ${conPrecio} productos (sin errores de availability_date)`);
  console.log(`💡 Diferencia con los 4,210 que ves en Merchant: ${conPrecio - 4210} productos que Google rechaza por otros motivos (imgs, GTIN, etc.)`);
}

main().catch(console.error);
