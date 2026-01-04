// firebase.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth'; // ✅ Agregar esta línea

// ✅ Asegúrate que este bucket termina en `.appspot.com`, no `.firebasestorage.app`
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "starfigs-29d31", // ← SIN .appspot.com
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar app (solo una vez)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportar instancias
export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // ✅ Agregar esta línea
export { Timestamp };
