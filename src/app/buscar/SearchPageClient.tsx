"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import { Pagination } from "@/components/ui/pagination"
import { ChevronRight, Home, Search, Package } from "lucide-react"
import Link from "next/link"
import type { ProductSearchResponse, SearchProduct } from "@/lib/search/types"

interface SearchPageClientProps {
  initialQuery: string
  initialPage: number
}

const ITEMS_PER_PAGE = 12

export default function SearchPageClient({ initialQuery, initialPage }: SearchPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [products, setProducts] = useState<SearchProduct[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(Boolean(initialQuery.trim()))
  const [searchError, setSearchError] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [pageTransitioning, setPageTransitioning] = useState(false)

  const resultsRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++requestIdRef.current

    const performSearch = async () => {
      const trimmedQuery = query.trim()
      if (trimmedQuery.length < 2) {
        setProducts([])
        setTotalProducts(0)
        setSearchError(false)
        setLoading(false)
        setPageTransitioning(false)
        return
      }

      setLoading(true)
      setSearchError(false)

      try {
        const params = new URLSearchParams({
          q: trimmedQuery,
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        })
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Search request failed: ${response.status}`)

        const payload = (await response.json()) as ProductSearchResponse
        if (requestId !== requestIdRef.current) return

        setProducts(payload.products)
        setTotalProducts(payload.total)

        if (payload.page !== currentPage) {
          setCurrentPage(payload.page)
          const nextParams = new URLSearchParams()
          nextParams.set("q", trimmedQuery)
          if (payload.page > 1) nextParams.set("page", payload.page.toString())
          router.replace(`/buscar?${nextParams.toString()}`, { scroll: false })
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        console.error("Error en busqueda:", error)
        setProducts([])
        setTotalProducts(0)
        setSearchError(true)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setPageTransitioning(false)
        }
      }
    }

    performSearch()
    return () => controller.abort()
  }, [currentPage, query, retryNonce, router])

  useEffect(() => {
    const urlQuery = searchParams.get("q") || ""
    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const urlPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    setQuery(urlQuery)
    setCurrentPage(urlPage)
  }, [searchParams])

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)

  const paginationInfo = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + products.length, totalProducts)
    return {
      startIndex: totalProducts === 0 ? 0 : startIndex + 1,
      endIndex,
      totalItems: totalProducts,
      currentPage,
      totalPages,
    }
  }, [currentPage, products.length, totalPages, totalProducts])

  const handlePageChange = (newPage: number) => {
    setPageTransitioning(true)

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }

    const params = new URLSearchParams()
    if (query) params.set("q", query)
    params.set("page", newPage.toString())
    const newUrl = `/buscar?${params.toString()}`
    router.push(newUrl, { scroll: false })
    setCurrentPage(newPage)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-[1536px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Home className="w-4 h-4 mr-1" />
            Inicio
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 dark:text-gray-200 font-medium">Búsqueda</span>
          {query && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">&quot;{query}&quot;</span>
            </>
          )}
        </nav>

        <div ref={resultsRef} />

        {/* Results */}
        {!query ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Realiza una búsqueda</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Usa la barra de búsqueda en la parte superior para encontrar productos específicos
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Puedes buscar por:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>
                  • <strong>Nombre del producto:</strong> &quot;Goku&quot;, &quot;Nezuko&quot;, &quot;Luffy&quot;
                </li>
                <li>
                  • <strong>Fabricante:</strong> &quot;Banpresto&quot;, &quot;Good Smile Company&quot;
                </li>
                <li>
                  • <strong>Línea:</strong> &quot;Nendoroid&quot;, &quot;Figma&quot;, &quot;Pop Up Parade&quot;
                </li>
                <li>
                  • <strong>Escala:</strong> &quot;1/7&quot;, &quot;1/8&quot;
                </li>
                <li>
                  • <strong>Serie:</strong> &quot;One Piece&quot;, &quot;Dragon Ball&quot;
                </li>
              </ul>
            </div>
          </div>
        ) : query.trim().length < 2 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Escribe al menos 2 caracteres
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Así podemos mostrarte resultados útiles del catálogo.
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Buscando productos...</p>
          </div>
        ) : searchError ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No pudimos completar la búsqueda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Inténtalo nuevamente en un momento.</p>
            <button
              type="button"
              onClick={() => setRetryNonce((value) => value + 1)}
              className="px-5 py-2.5 bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No hay productos que contengan los términos: <strong>&quot;{query}&quot;</strong>
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sugerencias:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Verifica la ortografía de todos los términos</li>
                <li>• Busca solo por el nombre del personaje o serie</li>
                <li>• Intenta con términos más generales</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Package className="w-5 h-5" />
                  <span className="font-semibold">
                    {paginationInfo.startIndex}-{paginationInfo.endIndex} de {paginationInfo.totalItems} productos
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">para &quot;{query}&quot;</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              </div>
            </div>

            <div className={`mb-8 grid grid-cols-3 gap-2 transition-opacity duration-200 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6 ${
              pageTransitioning ? "opacity-0" : "opacity-100"
            }`}>
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 2} />
              ))}
            </div>

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
