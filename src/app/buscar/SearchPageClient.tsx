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
  views?: number
}

interface SearchPageClientProps {
  initialQuery: string
  initialPage: number
}

const getItemsPerPage = () => {
  if (typeof window === "undefined") return 20
  const width = window.innerWidth
  if (width >= 1280) return 20
  if (width >= 768) return 16
  if (width >= 640) return 12
  return 8
}

function strictSearchFilter(products: Product[], query: string): Product[] {
  if (!query.trim()) return products

  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)

  const strictResults = products.filter((product) => {
    const searchableText = [
      product.name || "",
      product.brand || "",
      product.line || "",
      product.category || "",
      product.scale || "",
      product.description || "",
    ]
      .join(" ")
      .toLowerCase()

    return searchTerms.every((term) => searchableText.includes(term))
  })

  return strictResults
}

function sortByRelevance(products: Product[], query: string): Product[] {
  if (!query.trim()) return products

  const searchTerms = query.toLowerCase().trim().split(/\s+/)

  return [...products].sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    const textA = a.name.toLowerCase()
    const textB = b.name.toLowerCase()

    searchTerms.forEach((term) => {
      if (textA.includes(term)) {
        if (textA.startsWith(term)) scoreA += 10
        if (textA.includes(` ${term} `) || textA.startsWith(`${term} `) || textA.endsWith(` ${term}`)) {
          scoreA += 5
        }
        scoreA += 1
      }
      if (textB.includes(term)) {
        if (textB.startsWith(term)) scoreB += 10
        if (textB.includes(` ${term} `) || textB.startsWith(`${term} `) || textB.endsWith(` ${term}`)) {
          scoreB += 5
        }
        scoreB += 1
      }
    })

    const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    if (createdAtA > thirtyDaysAgo) {
      const daysSinceCreated = (now - createdAtA) / (24 * 60 * 60 * 1000)
      scoreA += Math.max(0, 5 - daysSinceCreated / 6)
    }
    if (createdAtB > thirtyDaysAgo) {
      const daysSinceCreated = (now - createdAtB) / (24 * 60 * 60 * 1000)
      scoreB += Math.max(0, 5 - daysSinceCreated / 6)
    }

    return scoreB - scoreA
  })
}

export default function SearchPageClient({ initialQuery, initialPage }: SearchPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [rawProducts, setRawProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(getItemsPerPage())
    }
    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)
    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setRawProducts([])
        return
      }
      setLoading(true)
      try {
        const results = await searchProducts(query.trim())
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

  const products = useMemo(() => {
    if (!query.trim() || rawProducts.length === 0) return rawProducts
    const strictFiltered = strictSearchFilter(rawProducts, query)
    const sorted = sortByRelevance(strictFiltered, query)
    return sorted
  }, [rawProducts, query])

  useEffect(() => {
    const urlQuery = searchParams.get("q") || ""
    const urlPage = Number.parseInt(searchParams.get("page") || "1", 10)
    if (urlQuery !== query) {
      setQuery(urlQuery)
      setCurrentPage(1)
    } else if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
  }, [searchParams, query, currentPage])

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

  const handlePageChange = (newPage: number) => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
        ) : loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Buscando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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