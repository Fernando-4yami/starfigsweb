import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/Navbar/Navbar"
import ScrollToTop from "@/components/scroll-to-top" // ← AGREGAR ESTO
import { Suspense } from "react"
import "../styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Starfigs - Figuras de Colección",
  description: "Tienda de figuras de colección, nendoroids, plushies y más",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ScrollToTop /> {/* ← AGREGAR ESTO */}
            <Navbar />
            {children}
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}