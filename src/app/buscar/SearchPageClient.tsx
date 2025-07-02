"use client"

import { useState, useEffect, useMemo, useRef } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import { searchProducts } from "@/lib/firebase/products"

import ProductCard from "@/components/ProductCard"

import { Pagination } from "@/components/ui/pagination"

import { ChevronRight, Home, Search, Package } from "lucide-react"

import Link from "next/link"

interface Product {
  id: string

  slug: string

  name: string

  imageUrls: string[]

  price: number

  heightCm?: number

  releaseDate?: Date | null

  brand?: string

  line?: string

  category?: string

  scale?: string

  description?: string

  createdAt?: Date | null

  views?: number // 🎯 AGREGAR ESTE CAMPO
}

interface SearchPageClientProps {
  initialQuery: string

  initialPage: number
}

// 🎯 CALCULAR PRODUCTOS POR PÁGINA RESPONSIVO (4 filas)

const getItemsPerPage = () => {
  if (typeof window === "undefined") return 20 // SSR fallback

  const width = window.innerWidth

  if (width >= 1280) return 20 // xl: 5 cols × 4 rows = 20

  if (width >= 768) return 16 // md: 4 cols × 4 rows = 16

  if (width >= 640) return 12 // sm: 3 cols × 4 rows = 12

  return 8 // mobile: 2 cols × 4 rows = 8
}

// 🎯 FUNCIÓN PARA FILTRADO ESTRICTO

function strictSearchFilter(products: Product[], query: string): Product[] {
  if (!query.trim()) return products

  // Limpiar y dividir la consulta en términos individuales

  const searchTerms = query

    .toLowerCase()

    .trim()

    .split(/\s+/) // Dividir por espacios

    .filter((term) => term.length > 0)

  console.log(`🔍 Términos de búsqueda estricta: [${searchTerms.join(", ")}]`)

  // Filtrar productos que contengan TODOS los términos

  const strictResults = products.filter((product) => {
    // Crear un texto combinado para buscar

    const searchableText = [
      product.name,
      product.brand,
      product.line,
      product.category,
      product.scale,
      product.description,
    ]

      .filter(Boolean)

      .join(" ")

      .toLowerCase()

    // Verificar que TODOS los términos estén presentes

    const allTermsPresent = searchTerms.every((term) => {
      const termPresent = searchableText.includes(term)

      if (!termPresent) {
        console.log(`❌ "${product.name}" no contiene el término "${term}"`)
      }

      return termPresent
    })

    if (allTermsPresent) {
      console.log(`✅ "${product.name}" contiene todos los términos`)
    }

    return allTermsPresent
  })

  console.log(`🎯 Filtrado estricto: ${strictResults.length} de ${products.length} productos`)

  return strictResults
}

// 🎯 FUNCIÓN PARA ORDENAR POR RELEVANCIA

function sortByRelevance(products: Product[], query: string): Product[] {
  if (!query.trim()) return products

  const searchTerms = query.toLowerCase().trim().split(/\s+/)

  return [...products].sort((a, b) => {
    let scoreA = 0

    let scoreB = 0

    // Calcular score para producto A

    const textA = a.name.toLowerCase()

    searchTerms.forEach((term) => {
      if (textA.includes(term)) {
        // Bonus si el término aparece al inicio del nombre

        if (textA.startsWith(term)) scoreA += 10

        // Bonus si el término aparece completo (no como parte de otra palabra)

        if (textA.includes(` ${term} `) || textA.startsWith(`${term} `) || textA.endsWith(` ${term}`)) {
          scoreA += 5
        }

        scoreA += 1 // Punto base por contener el término
      }
    })

    // Calcular score para producto B

    const textB = b.name.toLowerCase()

    searchTerms.forEach((term) => {
      if (textB.includes(term)) {
        if (textB.startsWith(term)) scoreB += 10

        if (textB.includes(` ${term} `) || textB.startsWith(`${term} `) || textB.endsWith(` ${term}`)) {
          scoreB += 5
        }

        scoreB += 1
      }
    })

    // Bonus por productos más recientes (createdAt)

    const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0

    const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0

    // Bonus para productos más recientes (últimos 30 días = bonus máximo)

    const now = Date.now()

    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    if (createdAtA > thirtyDaysAgo) {
      const daysSinceCreated = (now - createdAtA) / (24 * 60 * 60 * 1000)

      scoreA += Math.max(0, 5 - daysSinceCreated / 6) // 5 puntos máximo, decrece gradualmente
    }

    if (createdAtB > thirtyDaysAgo) {
      const daysSinceCreated = (now - createdAtB) / (24 * 60 * 60 * 1000)

      scoreB += Math.max(0, 5 - daysSinceCreated / 6) // 5 puntos máximo, decrece gradualmente
    }

    return scoreB - scoreA // Orden descendente
  })
}

export default function SearchPageClient({ initialQuery, initialPage }: SearchPageClientProps) {
  const router = useRouter()

  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)

  const [currentPage, setCurrentPage] = useState(initialPage)

  const [rawProducts, setRawProducts] = useState<Product[]>([]) // Productos sin filtrar

  const [loading, setLoading] = useState(false)

  const [itemsPerPage, setItemsPerPage] = useState(20)

  // 🎯 REF PARA SCROLL TO TOP

  const resultsRef = useRef<HTMLDivElement>(null)

  // 🎯 ACTUALIZAR ITEMS POR PÁGINA EN RESIZE

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(getItemsPerPage())
    }

    updateItemsPerPage()

    window.addEventListener("resize", updateItemsPerPage)

    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

  // 🔍 BÚSQUEDA DE PRODUCTOS (OBTENER RESULTADOS INICIALES)

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setRawProducts([])

        return
      }

      setLoading(true)

      try {
        console.log(`🔍 Buscando (inicial): "${query}"`)

        const results = await searchProducts(query.trim())

        console.log(`📦 Resultados iniciales: ${results.length} productos`)

        setRawProducts(results)
      } catch (error) {
        console.error("Error en búsqueda:", error)

        setRawProducts([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [query])

  // 🎯 APLICAR FILTRADO ESTRICTO Y ORDENAMIENTO

  const products = useMemo(() => {
    if (!query.trim() || rawProducts.length === 0) return rawProducts

    console.log(`🎯 Aplicando filtrado estricto para: "${query}"`)

    // 1. Aplicar filtrado estricto

    const strictFiltered = strictSearchFilter(rawProducts, query)

    // 2. Ordenar por relevancia

    const sorted = sortByRelevance(strictFiltered, query)

    console.log(`✅ Productos finales: ${sorted.length}`)

    return sorted
  }, [rawProducts, query])

  // 🎯 SINCRONIZAR CON URL PARAMS

  useEffect(() => {
    const urlQuery = searchParams.get("q") || ""

    const urlPage = Number.parseInt(searchParams.get("page") || "1", 10)

    if (urlQuery !== query) {
      setQuery(urlQuery)

      setCurrentPage(1) // Reset page when query changes
    } else if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
  }, [searchParams, query, currentPage])

  // 🎯 PAGINACIÓN

  const totalPages = Math.ceil(products.length / itemsPerPage)

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage

    const endIndex = startIndex + itemsPerPage

    return products.slice(startIndex, endIndex)
  }, [products, currentPage, itemsPerPage])

  const paginationInfo = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage

    const endIndex = Math.min(startIndex + itemsPerPage, products.length)

    return {
      startIndex: startIndex + 1,

      endIndex,

      totalItems: products.length,

      currentPage,

      totalPages,
    }
  }, [currentPage, itemsPerPage, products.length, totalPages])

  // 🚀 MANEJAR CAMBIO DE PÁGINA CON SCROLL TO TOP Y URL UPDATE

  const handlePageChange = (newPage: number) => {
    console.log(`📄 Cambiando a página ${newPage}`)

    // 🎯 SCROLL TO TOP SUAVE

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",

        block: "start",
      })
    } else {
      // Fallback: scroll to top of window

      window.scrollTo({
        top: 0,

        behavior: "smooth",
      })
    }

    // 🔧 ACTUALIZAR URL CON PUSH NAVIGATION

    const params = new URLSearchParams()

    if (query) params.set("q", query)

    params.set("page", newPage.toString())

    const newUrl = `/buscar?${params.toString()}`

    console.log(`🔗 Navegando a: ${newUrl}`)

    // 🚀 USAR PUSH EN LUGAR DE REPLACE

    router.push(newUrl, { scroll: false })

    setCurrentPage(newPage)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}

        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
            <Home className="w-4 h-4 mr-1" />
            Inicio
          </Link>

          <ChevronRight className="w-4 h-4" />

          <span className="text-gray-800 font-medium">Búsqueda</span>

          {query && (
            <>
              <ChevronRight className="w-4 h-4" />

              <span className="text-blue-600 font-medium">"{query}"</span>
            </>
          )}
        </nav>

        {/* 🎯 REF PARA SCROLL TO TOP */}

        <div ref={resultsRef} />

        {/* Resultados */}

        {!query ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Realiza una búsqueda</h3>

            <p className="text-gray-600 mb-6">
              Usa la barra de búsqueda en la parte superior para encontrar productos específicos
            </p>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500">Puedes buscar por:</p>

              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Nombre del producto:</strong> "Goku", "Nezuko", "Luffy"
                </li>

                <li>
                  • <strong>Fabricante:</strong> "Banpresto", "Good Smile Company", "Kotobukiya"
                </li>

                <li>
                  • <strong>Línea:</strong> "Nendoroid", "Figma", "Pop Up Parade"
                </li>

                <li>
                  • <strong>Escala:</strong> "1/7", "1/8", "1/4"
                </li>

                <li>
                  • <strong>Serie:</strong> "One Piece", "Dragon Ball", "Demon Slayer"
                </li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">💡 Búsqueda Estricta Activada</p>

              <p className="text-xs text-blue-700">
                Todos los términos de búsqueda deben estar presentes en el producto para aparecer en los resultados.
              </p>
            </div>

        
          </div>
        ) : loading ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

            <p className="text-gray-600">Buscando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />

            <h3 className="text-xl font-semibold text-gray-800 mb-2">No se encontraron resultados</h3>

            <p className="text-gray-600 mb-4">
              No hay productos que contengan los términos: <strong>"{query}"</strong>
            </p>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500">Sugerencias:</p>

              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Verifica la ortografía de todos los términos</li>

                <li>• Busca solo por el nombre del personaje o serie</li>

                <li>• Intenta con términos más generales</li>
              </ul>
            </div>

      
          </div>
        ) : (
          <>
            {/* 🎯 BARRA DE INFORMACIÓN CON PAGINACIÓN */}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Package className="w-5 h-5" />

                  <span className="font-semibold">
                    {paginationInfo.startIndex}-{paginationInfo.endIndex} de {paginationInfo.totalItems} productos
                  </span>

                  <span className="text-gray-500">para "{query}"</span>
                </div>

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de productos */}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* 🎯 COMPONENTE DE PAGINACIÓN */}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-8 mb-8"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
