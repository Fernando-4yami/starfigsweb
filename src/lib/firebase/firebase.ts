// src/lib/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXfYj3yO5y0JtL4ocVRvYK7T4lG5QtDv8",
  authDomain: "starfigs-29d31.firebaseapp.com",
  projectId: "starfigs-29d31",
  storageBucket: "starfigs-29d31.appspot.com",
  messagingSenderId: "937714963213",
  appId: "1:937714963213:web:279ede7394fc5677811644"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
