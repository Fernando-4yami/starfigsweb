"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

const GA_MEASUREMENT_ID = "G-6SN6FZ4XSZ" // Tu ID de Google Analytics

export default function GoogleAnalytics() {
  const [cookiesAccepted, setCookiesAccepted] = useState<boolean | null>(null)
  const [gaLoaded, setGaLoaded] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const consent = localStorage.getItem("cookies-consent")
    setCookiesAccepted(consent === "accepted")

    // 🚀 ESCUCHAR CAMBIOS EN TIEMPO REAL
    const handleStorageChange = () => {
      const newConsent = localStorage.getItem("cookies-consent")
      setCookiesAccepted(newConsent === "accepted")
    }

    // Escuchar cambios en localStorage
    window.addEventListener("storage", handleStorageChange)

    // También escuchar cambios en la misma pestaña
    const checkConsent = () => {
      const newConsent = localStorage.getItem("cookies-consent")
      if (newConsent === "accepted" && cookiesAccepted !== true) {
        setCookiesAccepted(true)
      }
    }

    const interval = setInterval(checkConsent, 1000) // Revisar cada segundo

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [cookiesAccepted])

  useEffect(() => {
    // 🚀 ACTIVAR GA CUANDO SE ACEPTEN COOKIES
    if (cookiesAccepted && gaLoaded && typeof window !== "undefined") {
      console.log("🚀 Activando Google Analytics...")

      // Inicializar Google Analytics
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      })

      window.gtag("config", GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
      })

      // Enviar evento de página vista inicial
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      })

      console.log("✅ Google Analytics activado correctamente")
    }
  }, [cookiesAccepted, gaLoaded])

  if (cookiesAccepted === false) {
    return null // No cargar GA si no se aceptaron cookies
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          setGaLoaded(true)
          console.log("📊 Google Analytics script cargado")
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Configurar consentimiento por defecto
          gtag('consent', 'default', {
            analytics_storage: 'denied'
          });
          
          // No configurar inmediatamente, esperar consentimiento
          console.log('📊 Google Analytics inicializado (esperando consentimiento)');
        `}
      </Script>
    </>
  )
}
