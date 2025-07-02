import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getStorage, type Storage } from "firebase-admin/storage"
import { readFileSync } from "fs"
import { join } from "path"

function initializeAdminAndGetStorage(): Storage | null {
  if (getApps().length > 0) {
    return getStorage()
  }



  const serviceAccountPath = join(process.cwd(), "lib/firebase/serviceAccountKey.json")

  try {
    const serviceAccountFileContents = readFileSync(serviceAccountPath, "utf8")
    const serviceAccount = JSON.parse(serviceAccountFileContents)

    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "starfigs-29d31",
    })

    console.log("✅ Firebase Admin SDK (admin.ts): Initialized successfully.")
    return getStorage()
  } catch (error) {
    console.error("❌ Firebase Admin SDK (admin.ts): Initialization error:", error)
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.error(
        `❌ CRÍTICO: No se encontró 'serviceAccountKey.json' en la ruta: ${serviceAccountPath}. Verifica que el archivo esté en la carpeta correcta.`,
      )
    }
    return null
  }
}

export const storage = initializeAdminAndGetStorage()

if (!storage) {
  console.warn(
    "⚠️ ADVERTENCIA: La instancia de Firebase Admin Storage es nula. Las subidas de archivos fallarán. Revisa los errores de inicialización de arriba.",
  )
}
