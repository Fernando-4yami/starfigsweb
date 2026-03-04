// scripts/make-all-public.mjs
import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./lib/firebase/serviceAccountKey.json", "utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "starfigs-29d31",
  });
}

const bucket = admin.storage().bucket();

async function makeAllPublic() {
  console.log("🚀 Haciendo públicas todas las imágenes...");

  const [files] = await bucket.getFiles({ prefix: 'products/' });
  console.log(`📦 Total: ${files.length} archivos`);

  let done = 0;
  for (const file of files) {
    try {
      await file.makePublic();
      done++;
      if (done % 10 === 0) console.log(`✅ Procesados: ${done}/${files.length}`);
    } catch (error) {
      console.error(`❌ Error: ${file.name}`);
    }
  }

  console.log(`\n🎉 Completado: ${done}/${files.length}`);
  console.log("\n📋 Ejemplo de URL:");
  console.log(`https://storage.googleapis.com/starfigs-29d31/${files[0].name}`);
}

makeAllPublic();