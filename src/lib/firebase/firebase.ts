import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXfYj3yO5y0JtL4ocVRvYK7T4lG5QtDv8",
  authDomain: "starfigs-29d31.firebaseapp.com",
  projectId: "starfigs-29d31",
  storageBucket: "starfigs-29d31.appspot.com", // corregido
  messagingSenderId: "937714963213",
  appId: "1:937714963213:web:279ede7394fc5677811644"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);
export { Timestamp }; // exporta Timestamp para usarlo en otros módulos
