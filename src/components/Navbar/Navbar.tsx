"use client"

import type React from "react"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Search } from "lucide-react"

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

  // Scroll detection for hiding/showing navbar
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY

      // Only hide on mobile (screen width < 1024px)
      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down & past 100px
          setIsNavbarVisible(false)
        } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
          // Scrolling up or at top
          setIsNavbarVisible(true)
        }
      } else {
        // Always show on desktop
        setIsNavbarVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    const handleResize = () => {
      // Show navbar when resizing to desktop
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

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && !(event.target as Element).closest(".mobile-menu")) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [mobileMenuOpen])

  // Prevenir scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
      // Show navbar when mobile menu is open
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
    { name: "SCALE", path: "/categorias/scale" },
    { name: "FIGURAS PRICING", path: "/categorias/pricing" },
  ]

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white shadow-md border-b border-blue-200 transition-transform duration-300 ease-in-out ${
          isNavbarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-500 transition-colors">
                Starfigs
              </Link>
            </div>

            {/* Buscador - Desktop */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar figuras, nendoroids, plushies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                </div>
              </form>
            </div>

            {/* Navegación Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.path}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Botón Hamburguesa */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Buscador Mobile - Debajo del navbar */}
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            </form>
          </div>
        </div>
      </nav>

      {/* Overlay para menú móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </div>
      )}

      {/* Menú Móvil */}
      <div
        className={`mobile-menu fixed top-0 right-0 z-50 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header del menú móvil */}
          <div className="flex items-center justify-between p-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-amber-50">
            <h2 className="text-lg font-semibold text-blue-800">Categorías</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenido del menú */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.path}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer del menú móvil */}
          <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-amber-50">
            <Link
              href="/"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              © 2024 Starfigs - Tienda de Anime
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
