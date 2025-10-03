"use client"

import type React from "react"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim() !== "") {
      router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("")
      searchInputRef.current?.blur()
    }
  }

  // Scroll detection
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY
      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsNavbarVisible(false)
        } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
          setIsNavbarVisible(true)
        }
      } else {
        setIsNavbarVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsNavbarVisible(true)
      }
    }

    window.addEventListener("scroll", controlNavbar, { passive: true })
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("scroll", controlNavbar)
      window.removeEventListener("resize", handleResize)
    }
  }, [lastScrollY])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && !(event.target as Element).closest(".mobile-menu")) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
      setIsNavbarVisible(true)
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  const categories = [
    { name: "ICHIBAN KUJI", path: "/categorias/ichiban-kuji" },
    { name: "POP UP PARADE", path: "/categorias/pop-up-parade" },
    { name: "NENDOROID", path: "/categorias/nendoroid" },
    { name: "FIGMA", path: "/categorias/figma" },
    { name: "FIGUARTS", path: "/categorias/figuarts" },
    { name: "PLUSH", path: "/categorias/plush" },
    { name: "ESCALA", path: "/categorias/scale" },
    { name: "FIGURAS DE PREMIO", path: "/categorias/pricing" },
  ]

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out ${
          isNavbarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo con imagen pequeña e invertida en dark */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/starfigs.png"
                  alt="Starfigs Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto dark:invert"
                  priority
                />
              </Link>
            </div>

            {/* Buscador - Desktop */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar figuras, nendoroids, plushies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
              </form>
            </div>

            {/* Navegación Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.path}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-md transition-all duration-200"
                >
                  {category.name}
                </Link>
              ))}

              {/* 🔥 Ocultamos el botón de tema en dark */}
              <div className="dark:hidden">
                <ThemeToggle />
              </div>
            </div>

            {/* Botones Mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* 🔥 Ocultamos también en dark en móvil */}
              <div className="dark:hidden">
                <ThemeToggle />
              </div>
              <button
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </div>
      )}

      {/* Menú Móvil */}
      <div
        className={`mobile-menu fixed top-0 right-0 z-50 h-full w-80 max-w-sm bg-gray-50 dark:bg-gray-950 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Categorías</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.path}
                  className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            <Link
              href="/"
              className="block text-center text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              © 2025 Starfigs
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
