import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/Navbar/Navbar"
import Footer from "@/components/Footer"
import ScrollToTop from "@/components/scroll-to-top"
import PageTransitionProvider from "@/components/PageTransitionProvider"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import CookieBanner from "@/components/CookieBanner"
import { Suspense } from "react"
import "../styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

function NavigationFallback() {
  return (
    <div className="animate-pulse border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL("https://starfigsperu.com"),
  title: {
    default: "Starfigs Perú - Figuras Anime Originales | Nendoroid, Figma, Ichiban Kuji",

    template: "%s | Starfigs Perú",
  },
  description:
    "Las mejores figuras de anime originales en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji y más. Envío gratis por Agencias Shalom. Compra figuras importadas desde Japón.",
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
    title: "Starfigs Perú - Figuras Anime Originales | Nendoroid, Figma, Ichiban Kuji",
    description:
      "Las mejores figuras de anime originales en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji y más. Envío gratis por Agencias Shalom.",
    url: "https://starfigsperu.com",
    images: [
      {
        url: "https://starfigsperu.com/og-default.png",
        width: 1200,
        height: 630,
        alt: "Starfigs Perú - Figuras de Anime Originales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starfigs Perú - Figuras de Anime Originales",

    description:
      "Las mejores figuras de anime originales en Perú. Envío gratis.",
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
        <ThemeProvider>
          <PageTransitionProvider>
            <ScrollToTop />
            <Suspense fallback={<NavigationFallback />}>
              <Navbar />
            </Suspense>
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </PageTransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
