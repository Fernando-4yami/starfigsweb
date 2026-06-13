import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/Navbar/Navbar"
import Footer from "@/components/Footer"
import ScrollToTop from "@/components/scroll-to-top"
import PageTransitionProvider from "@/components/PageTransitionProvider"
import RoutePrefetcher from "@/components/RoutePrefetcher"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import CookieBanner from "@/components/CookieBanner"
import { Suspense } from "react"
import "../styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://starfigsperu.com"),
  title: {
    default: "Starfigs Perú - Figuras de Anime en Preventa | Envío Gratis",
    template: "%s | Starfigs Perú",
  },
  description:
    "Las mejores figuras de anime en preventa en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji y más. Envío gratis por Agencias Shalom. Compra figuras originales importadas.",
  keywords: [
    "figuras anime",
    "figuras anime perú",
    "figuras de anime en preventa",
    "nendoroid perú",
    "figma perú",
    "figuras de colección",
    "preventa anime",
    "starfigs",
    "figuras originales perú",
    "envío gratis figuras",
  ],
  alternates: {
    canonical: "https://starfigsperu.com",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Starfigs Perú",
    title: "Starfigs Perú - Figuras de Anime en Preventa | Envío Gratis",
    description:
      "Las mejores figuras de anime en preventa en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji y más. Envío gratis por Agencias Shalom.",
    url: "https://starfigsperu.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starfigs Perú - Figuras de Anime en Preventa",
    description:
      "Las mejores figuras de anime en preventa en Perú. Envío gratis.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "google6d9754cddb1d9457",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconnect a Firebase Storage para carga rápida de imágenes */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <GoogleAnalytics />
        <CookieBanner />
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider>
            <PageTransitionProvider>
              <RoutePrefetcher />
              <ScrollToTop />
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
            </PageTransitionProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}