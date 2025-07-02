import type React from "react"
import "@/styles/globals.css"
import Navbar from "@/components/Navbar/Navbar"
import type { Metadata } from "next"
import { generateOrganizationJsonLd } from "@/lib/metadata"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import CookieBanner from "@/components/CookieBanner"
import ScrollToTop from "@/components/scroll-to-top"
import { Suspense } from "react"

export const metadata: Metadata = {
  metadataBase: new URL("https://starfigsperu.com"), // En producción
  // metadataBase: new URL('http://localhost:3000'), // En desarrollo - descomenta esta línea si estás en desarrollo
  title: {
    default: "Starfigs - Tienda de Figuras de Anime | Nendoroids, Figmas y Coleccionables",
    template: "%s | Starfigs",
  },
  description:
    "Descubre las mejores figuras de anime, nendoroids, figmas y coleccionables. Nuevos lanzamientos, productos populares y envío a todo el país.",
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://starfigsperu.com",
    siteName: "Starfigs",
    title: "Starfigs - Tienda de Figuras de Anime",
    description:
      "Las mejores figuras de anime, nendoroids, figmas y coleccionables. Nuevos lanzamientos y productos populares.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Starfigs - Tienda de Figuras de Anime",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starfigs - Tienda de Figuras de Anime",
    description: "Las mejores figuras de anime y coleccionables",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = generateOrganizationJsonLd()

  return (
    <html lang="es">
      <head>
        {/* 🚀 PRECONNECT CRÍTICO PARA IMÁGENES */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* 🚀 DNS-PREFETCH OPTIMIZADO */}
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />

        {/* 🚀 ICONOS */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* 🚀 MANIFEST PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* 🚀 THEME COLOR */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* 🚀 OPTIMIZACIONES CRÍTICAS */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* 🚀 JSON-LD PARA SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>

        {/* 🎯 SCROLL TO TOP AUTOMÁTICO */}
        <ScrollToTop />

        <Navbar />
        <main>{children}</main>
        <CookieBanner />
      </body>
    </html>
  )
}
