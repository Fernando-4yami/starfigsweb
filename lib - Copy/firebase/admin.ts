import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { getStorage, type Storage } from "firebase-admin/storage";
import * as fs from "fs";
import { join } from "path";

let serviceAccount: any;

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // ✅ Producción (Vercel)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // ✅ Entorno local
    const path = join(process.cwd(), "lib/firebase/serviceAccountKey.json");
    if (fs.existsSync(path)) {
      serviceAccount = JSON.parse(fs.readFileSync(path, "utf8"));
    } else {
      console.error("❌ No se encontró serviceAccountKey.json en entorno local");
      throw new Error("Falta serviceAccountKey.json");
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "starfigs-29d31.appspot.com",
  });
}

export { admin };
export const storage: Storage = getStorage();
