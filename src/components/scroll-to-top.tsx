// src/components/scroll-to-top.tsx - VERSIÓN MEJORADA
"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // 🎯 SCROLL TO TOP INMEDIATO AL CAMBIAR DE RUTA
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // ← CAMBIO CRÍTICO: de "smooth" a "instant"
    })

    // 🔧 FALLBACK: Por si el primer scroll no funciona
    const timer = setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo(0, 0)
      }
    }, 10)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}