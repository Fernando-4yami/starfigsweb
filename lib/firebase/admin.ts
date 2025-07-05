import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { getStorage, type Storage } from "firebase-admin/storage";

let serviceAccount: any;

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // ✅ Entorno de producción (Vercel)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // ✅ Entorno local
    serviceAccount = require("./serviceAccountKey.json");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "starfigs-29d31.appspot.com",
  });
}

export { admin };
export const storage: Storage = getStorage();
