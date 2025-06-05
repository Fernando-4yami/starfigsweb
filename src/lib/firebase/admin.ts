// lib/firebase/admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), 'lib/firebase/serviceAccountKey.json'), 'utf8')
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'starfigs-29d31', // 👈 reemplaza esto por el bucket real
  });
}

export const storage = getStorage();
