"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Rutas principales que se precargan en segundo plano
const routesToPrefetch = [
  "/categorias/nendoroid",
  "/categorias/figma",
  "/categorias/figuarts",
  "/categorias/ichiban-kuji",
  "/categorias/pop-up-parade",
  "/categorias/plush",
  "/categorias/scale",
  "/categorias/pricing",
  "/catalogo",
]

export default function RoutePrefetcher() {
  const router = useRouter()

  useEffect(() => {
    const prefetchAll = () => {
      for (const route of routesToPrefetch) {
        try {
          router.prefetch(route)
        } catch {
          // Ignorar errores de prefetch (edge cases)
        }
      }
    }

    // Prefetch apenas la página termine de cargar
    if (document.readyState === "complete") {
      prefetchAll()
    } else {
      window.addEventListener("load", prefetchAll, { once: true })
    }
  }, [router])

  return null
}
