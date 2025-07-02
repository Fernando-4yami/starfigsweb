"use client"

import { useState, useEffect } from "react"

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya respondió sobre las cookies
    const consent = localStorage.getItem("cookies-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookies-consent", "accepted")
    setShowBanner(false)

    // 🚀 ACTIVAR GA DINÁMICAMENTE SIN RELOAD
    if (typeof window !== "undefined" && window.gtag) {
      // Actualizar consentimiento
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      })

      // Enviar evento de consentimiento
      window.gtag("event", "consent_granted", {
        event_category: "cookies",
        event_label: "user_accepted",
      })

      console.log("✅ Google Analytics activado dinámicamente")
    }

    // 🎉 NO MÁS RELOAD - GA se activa inmediatamente
  }

  const rejectCookies = () => {
    localStorage.setItem("cookies-consent", "rejected")
    setShowBanner(false)

    // Enviar evento de rechazo (si GA ya estaba cargado)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "consent_rejected", {
        event_category: "cookies",
        event_label: "user_rejected",
      })
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50 animate-slide-up">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-2">🍪 Uso de Cookies</h3>
          <p className="text-sm text-gray-300">
            Utilizamos cookies para mejorar tu experiencia de navegación y analizar el tráfico del sitio. Al aceptar,
            nos ayudas a entender cómo usas nuestra tienda para ofrecerte un mejor servicio.
          </p>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 text-sm border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105 transition-transform"
          >
            ✅ Aceptar Cookies
          </button>
        </div>
      </div>
    </div>
  )
}
