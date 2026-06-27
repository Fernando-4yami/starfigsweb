"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

const GA_MEASUREMENT_ID = "G-6SN6FZ4XSZ" // Tu ID de Google Analytics

export default function GoogleAnalytics() {
  const [cookiesAccepted, setCookiesAccepted] = useState<boolean | null>(null)
  const [gaLoaded, setGaLoaded] = useState(false)

  useEffect(() => {
    const syncConsent = () => {
      setCookiesAccepted(localStorage.getItem("cookies-consent") === "accepted")
    }

    syncConsent()
    window.addEventListener("storage", syncConsent)
    window.addEventListener("cookie-consent-changed", syncConsent)

    return () => {
      window.removeEventListener("storage", syncConsent)
      window.removeEventListener("cookie-consent-changed", syncConsent)
    }
  }, [])

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

  if (cookiesAccepted !== true) {
    return null
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
