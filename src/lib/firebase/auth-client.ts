// src/lib/firebase/auth-client.ts
// ⚠️ Separado de firebase.ts para que la homepage no cargue Firebase Auth (90KB)
import { getAuth } from "firebase/auth"
import { app } from "./firebase"

export const auth = getAuth(app)
