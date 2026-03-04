// scripts/make-all-images-public-simple.mjs
import admin from "firebase-admin";
import { readFileSync } from "fs";

// ✅ LEER DIRECTAMENTE EL ARCHIVO JSON
const serviceAccountPath = "./lib/firebase/serviceAccountKey.json";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
  console.log("✅ Service account cargado correctamente");
} catch (error) {
  console.error("❌ ERROR: No se pudo leer el archivo serviceAccountKey.json");
  console.error("Ruta esperada:", serviceAccountPath);
  console.error("Error:", error.message);
  process.exit(1);
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "starfigs-29d31",
  });
}

const bucket = admin.storage().bucket();

async function makeAllImagesPublic() {
  try {
    console.log("🚀 Iniciando proceso para hacer públicas todas las imágenes...");

    const [files] = await bucket.getFiles({
      prefix: 'products/',
    });

    console.log(`📦 Encontrados ${files.length} archivos en products/`);

    if (files.length === 0) {
      console.log("⚠️ No hay archivos para procesar");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (file) => {
          try {
            await file.makePublic();
            console.log(`✅ [${i + 1}-${Math.min(i + batchSize, files.length)}/${files.length}]: ${file.name}`);
            successCount++;
          } catch (error) {
            console.error(`❌ Error con ${file.name}:`, error.message);
            errorCount++;
          }
        })
      );
    }

    console.log("\n🎉 PROCESO COMPLETADO");
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    if (files.length > 0) {
      console.log("\n📋 Ejemplos de URLs públicas:");
      const examples = files.slice(0, 3);
      examples.forEach(file => {
        console.log(`https://storage.googleapis.com/${bucket.name}/${file.name}`);
      });
    }

  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

makeAllImagesPublic();