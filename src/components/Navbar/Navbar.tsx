"use client"

import type React from "react"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Menu, X, Search } from "lucide-react"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { searchProducts } from "@/lib/firebase/products"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipDebounceRef = useRef(false)
  const typedTermRef = useRef("")
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim() !== "") {
      router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("")
      setSuggestions([])
      setShowSuggestions(false)
      typedTermRef.current = ""
      searchInputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (label: string) => {
    router.push(`/buscar?q=${encodeURIComponent(label)}`)
    setSearchTerm("")
    setSuggestions([])
    setShowSuggestions(false)
    typedTermRef.current = ""
    searchInputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    typedTermRef.current = e.target.value
  }

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false)
    setSelectedIndex(-1)
    setSearchTerm(typedTermRef.current)
  }, [])

  // Debounce + fetch suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const term = searchTerm.trim().toLowerCase()
    if (term.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (skipDebounceRef.current) {
      skipDebounceRef.current = false
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchProducts(term)
        const seen = new Set<string>()
        const terms: string[] = []

        // Colectar líneas y marcas conocidas para filtrar
        const known = new Set<string>()
        for (const p of results) {
          if (p.line) known.add(p.line.toLowerCase())
          if (p.brand) known.add(p.brand.toLowerCase())
        }
        // Palabras genéricas a ignorar
        const genericWords = /^(ver|version|type|the|anime|figure|figura|original|limited|exclusive|special|set|bunny|bare|leg|dx|reissue|re|edition|release|final|battle|awakening|awakened|mode|form|edit|another|extra|secret|rare|normal)$/i

        for (const p of results) {
          if (terms.length >= 8) break

          // Separar el nombre y buscar la parte que contiene el término
          const segments = p.name.split(/[-–—/·|]+/).map((s) => s.trim())
          
          for (let segment of segments) {
            if (terms.length >= 8) break
            const lower = segment.toLowerCase()
            
            // Saltar si no contiene el término
            if (!lower.includes(term) && !lower.split(/\s+/).some((w) => w.startsWith(term))) continue
            
            // Limpiar: quitar texto entre paréntesis
            segment = segment.replace(/\([^)]*\)/g, '').trim()
            if (!segment || segment.length < 2) continue

            // Remover palabras que sean líneas o marcas conocidas
            const words = segment.split(/\s+/)
            const filtered = words.filter((w) => {
              const wl = w.toLowerCase()
              return !known.has(wl) && !genericWords.test(w)
            })
            segment = filtered.join(' ').trim()
            if (!segment || segment.length < 2) continue
            
            const cleaned = segment.toLowerCase()
            
            // Saltar si ya está en la lista
            if (seen.has(cleaned)) continue
            if (genericWords.test(cleaned)) continue
            
            seen.add(cleaned)
            terms.push(segment)
          }
        }

        setSuggestions(terms)
        setShowSuggestions(terms.length > 0)
      } catch {
        setSuggestions([])
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  // Click outside → cerrar sugerencias (usa clase CSS para detectar ambos dropdowns)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (
        !target.closest(".search-suggestions") &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        closeSuggestions()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [closeSuggestions])

  // Cerrar sugerencias en cualquier cambio de ruta (navegación, paginación, etc.)
  useEffect(() => {
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }, [pathname, searchParams])

  // Escape → cerrar sugerencias / Flechas → navegar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSuggestions()
      searchInputRef.current?.blur()
    }

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next = selectedIndex + 1
        if (next < suggestions.length) {
          setSelectedIndex(next)
          setSearchTerm(suggestions[next])
          skipDebounceRef.current = true
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prev = selectedIndex - 1
        if (prev >= 0) {
          setSelectedIndex(prev)
          setSearchTerm(suggestions[prev])
          skipDebounceRef.current = true
        } else {
          setSelectedIndex(-1)
          setSearchTerm(typedTermRef.current)
        }
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        handleSuggestionClick(suggestions[selectedIndex])
      }
    }
  }

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
      if (window.innerWidth >= 1024) setIsNavbarVisible(true)
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
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = "hidden"
      document.body.style.paddingRight = `${scrollbarWidth}px`
      setIsNavbarVisible(true)
    } else {
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""
    }
  }, [mobileMenuOpen])

  const SearchDropdown = () => {
    if (!showSuggestions) return null

    return (
      <div
        className="search-suggestions absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
          Sugerencias
        </div>
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              handleSuggestionClick(suggestion)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full block px-4 py-2.5 text-sm text-left text-gray-800 dark:text-gray-200 transition-colors duration-150 ${
              selectedIndex === index
                ? "bg-amber-50 dark:bg-amber-950/20"
                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            {suggestion}
          </button>
        ))}
        <Link
          href={`/buscar?q=${encodeURIComponent(searchTerm.trim())}`}
          onClick={() => {
            setSearchTerm("")
            setSuggestions([])
            setShowSuggestions(false)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors border-t border-gray-100 dark:border-gray-700"
        >
          <Search className="w-4 h-4" />
          Ver todos los resultados para &quot;{searchTerm.trim()}&quot;
        </Link>
      </div>
    )
  }

  const categories = [
    { name: "Blog", path: "/blog", isHighlight: false },
    { name: "Cómo funciona", path: "/#como-funciona", isHighlight: true },
    { name: "Ichiban Kuji", path: "/categorias/ichiban-kuji" },
    { name: "Pop Up Parade", path: "/categorias/pop-up-parade" },
    { name: "Nendoroid", path: "/categorias/nendoroid" },
    { name: "Figma", path: "/categorias/figma" },
    { name: "S.H.Figuarts", path: "/categorias/figuarts" },
    { name: "Plush", path: "/categorias/plush" },
    { name: "Escala", path: "/categorias/scale" },
    { name: "Premio", path: "/categorias/pricing" },
  ]

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out ${
          isNavbarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Fila 1: Logo + Buscador(desktop) + Botones */}
          <div className="flex items-center gap-3 h-12 md:h-14">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/starfigs.webp"
                  alt="Starfigs Logo"
                  width={120}
                  height={32}
                  className="h-8 md:h-10 w-auto dark:invert dark:brightness-0 dark:contrast-200 transition-all duration-300"
                  priority
                />
              </Link>
            </div>

            {/* Buscador Desktop - al lado del logo, ocupa espacio restante */}
            <div className="hidden md:flex flex-1 relative z-50">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar productos, personajes, series, marcas..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  autoComplete="off"
                  className="w-full pl-14 pr-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           placeholder-gray-400 dark:placeholder-gray-500
                           focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-colors text-sm"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                {showSuggestions && <SearchDropdown />}
              </form>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <ThemeToggle />
              <button
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Fila 2: Navegación de categorías */}
          <div className="hidden lg:flex items-center justify-center gap-10 pb-3 border-t border-gray-100 dark:border-gray-800 pt-2.5">
            <div className="flex items-center gap-1">
              {categories.slice(1).map((category) => (
                <Link
                  key={category.name}
                  href={category.path}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    category.isHighlight
                      ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("como-funciona")
                if (el) el.scrollIntoView({ behavior: "smooth" })
                else window.location.href = "/#como-funciona"
              }}
              className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-200 border border-amber-200 dark:border-amber-800 flex-shrink-0 cursor-pointer"
            >
              {categories[0].name}
            </button>
          </div>

          {/* Buscador Móvil */}
          <div className="md:hidden mt-2 pb-3 relative z-50">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar figuras..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                autoComplete="off"
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-700 
                         bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {showSuggestions && <SearchDropdown />}
            </form>
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
        className={`mobile-menu fixed top-0 right-0 z-50 h-full w-80 max-w-sm bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Categorías</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
            {/* Categorías primero */}
            {categories.slice(1).map((category) => (
              <Link
                key={category.name}
                href={category.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-base font-medium transition-all duration-200 ${
                  category.isHighlight
                    ? "text-amber-600 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {category.name}
              </Link>
            ))}
            {/* Cómo funciona al final */}
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setTimeout(() => {
                    const el = document.getElementById("como-funciona")
                    if (el) el.scrollIntoView({ behavior: "smooth" })
                    else window.location.href = "/#como-funciona"
                  }, 150)
                }}
                className="block px-4 py-3 text-base font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-all duration-200 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
              >
                {categories[0].name}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
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