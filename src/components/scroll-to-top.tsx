"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // 🎯 SCROLL TO TOP AL CAMBIAR DE RUTA
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
