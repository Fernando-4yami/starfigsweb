"use client"

import { getProducts, type Product } from "@/lib/firebase/products"
import { useState, useEffect, useRef, useCallback } from "react"
import ProductCard from "@/components/ProductCard"
import type { SerializedProduct } from "@/lib/serialize-product"
import {
  getCachedRelatedProducts,
  setCachedRelatedProducts,
  cleanupRelatedProductsCache,
} from "@/lib/cache/related-products-cache"

interface InfiniteRelatedProductsProps {
  currentProduct: SerializedProduct | Product
  initialBatchSize?: number
  loadMoreBatchSize?: number
}

// 🎯 TIPOS DE COINCIDENCIA POR JERARQUÍA
enum MatchType {
  NOMBRE_Y_LINEA = 1,
  NOMBRE = 2,
  LINEA = 3,
}

interface ProductMatch {
  product: Product
  matchType: MatchType
  nameScore: number
  lineScore: number
  totalScore: number
  reasons: string[]
}

function extractKeywords(productName: string): string[] {
  const cleanName = productName
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const stopWords = [
    "figura", "figure", "figurine", "scale", "cm", "pvc", "abs", "limited",
    "edition", "special", "ver", "version", "vol", "volume", "set", "pack",
    "collection", "series", "line", "model", "kit", "de", "la", "el", "en",
    "y", "con", "para", "por", "un", "una", "the", "and", "or", "in", "on",
    "at", "to", "for", "of", "with",
  ]

  const words = cleanName
    .split(" ")
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.includes(word))
    .filter((word) => !/^\d+$/.test(word))

  return [...new Set(words)]
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const keywords1 = extractKeywords(name1)
  const keywords2 = extractKeywords(name2)

  if (keywords1.length === 0 || keywords2.length === 0) return 0

  const exactMatches = keywords1.filter((word1) => keywords2.some((word2) => word1 === word2)).length
  const partialMatches = keywords1.filter((word1) =>
    keywords2.some((word2) => word1.includes(word2) || word2.includes(word1)),
  ).length

  const totalKeywords = Math.max(keywords1.length, keywords2.length)
  const exactScore = (exactMatches / totalKeywords) * 100
  const partialScore = (partialMatches / totalKeywords) * 50

  return Math.min(exactScore + partialScore, 100)
}

function isExactLineMatch(line1: string, line2: string): boolean {
  if (!line1 || !line2) return false
  const normalize = (str: string) => str.toLowerCase().trim()
  return normalize(line1) === normalize(line2)
}

function classifyProductMatch(currentProduct: SerializedProduct | Product, product: Product): ProductMatch | null {
  const nameScore = calculateNameSimilarity(currentProduct.name, product.name)
  const isLineExact = isExactLineMatch(currentProduct.line || "", product.line || "")

  const NAME_SIMILARITY_THRESHOLD = 40
  const isNameSimilar = nameScore >= NAME_SIMILARITY_THRESHOLD
  const reasons: string[] = []

  let matchType: MatchType
  let totalScore = 0

  if (isNameSimilar && isLineExact) {
    matchType = MatchType.NOMBRE_Y_LINEA
    totalScore = 1000 + nameScore
    reasons.push(`nombre similar (${nameScore.toFixed(1)}%) + línea exacta`)
  } else if (isNameSimilar) {
    matchType = MatchType.NOMBRE
    totalScore = 500 + nameScore
    reasons.push(`nombre similar (${nameScore.toFixed(1)}%)`)
  } else if (isLineExact) {
    matchType = MatchType.LINEA
    totalScore = 100
    reasons.push(`línea exacta: "${product.line}"`)
  } else {
    return null
  }

  if (currentProduct.brand && product.brand === currentProduct.brand) {
    totalScore += 5
    reasons.push(`misma marca: "${product.brand}"`)
  }

  if (currentProduct.category && product.category === currentProduct.category) {
    totalScore += 3
    reasons.push(`misma categoría: "${product.category}"`)
  }

  if (product.views && product.views > 10) {
    totalScore += Math.min(Math.floor(product.views / 100), 2)
    reasons.push(`popular: ${product.views} vistas`)
  }

  return {
    product,
    matchType,
    nameScore,
    lineScore: isLineExact ? 100 : 0,
    totalScore,
    reasons,
  }
}

export default function InfiniteRelatedProducts({
  currentProduct,
  initialBatchSize = 8,
  loadMoreBatchSize = 8,
}: InfiniteRelatedProductsProps) {
  const [allRelatedProducts, setAllRelatedProducts] = useState<Product[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const fetchAllRelatedProducts = async () => {
      try {
        setLoading(true)
        console.log(`🎯 BÚSQUEDA JERÁRQUICA de productos relacionados para: "${currentProduct.name}"`)

        const currentLine = currentProduct.line || ""
        const currentSeries = extractKeywords(currentProduct.name)

        const cachedProducts = getCachedRelatedProducts(
          currentProduct.id,
          currentLine,
          currentSeries,
          currentProduct.name,
        )

        if (cachedProducts && cachedProducts.length > 0) {
          setAllRelatedProducts(cachedProducts)
          const initialProducts = cachedProducts.slice(0, initialBatchSize)
          setDisplayedProducts(initialProducts)
          setCurrentIndex(initialBatchSize)
          setHasMore(cachedProducts.length > initialBatchSize)
          setLoading(false)
          return
        }

        console.log(`🔍 No hay cache, consultando base de datos...`)
        const allProducts = await getProducts(300)

        console.log(`📋 Producto actual:`)
        console.log(`  - Nombre: "${currentProduct.name}"`)
        console.log(`  - Línea: "${currentLine}"`)

        const productMatches: ProductMatch[] = []

        allProducts
          .filter((product) => product.slug !== currentProduct.slug)
          .forEach((product) => {
            const match = classifyProductMatch(currentProduct, product)
            if (match) {
              productMatches.push(match)
            }
          })

        productMatches.sort((a, b) => {
          if (a.matchType !== b.matchType) {
            return a.matchType - b.matchType
          }
          return b.totalScore - a.totalScore
        })

        const finalProducts = productMatches.map((match) => match.product)

        setCachedRelatedProducts(currentProduct.id, finalProducts, currentLine, currentSeries, currentProduct.name)

        setAllRelatedProducts(finalProducts)
        const initialProducts = finalProducts.slice(0, initialBatchSize)
        setDisplayedProducts(initialProducts)
        setCurrentIndex(initialBatchSize)
        setHasMore(finalProducts.length > initialBatchSize)

        console.log(`✅ Encontrados ${finalProducts.length} productos relacionados por JERARQUÍA`)
      } catch (error) {
        console.error("Error fetching infinite related products:", error)
        setAllRelatedProducts([])
        setDisplayedProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllRelatedProducts()
  }, [currentProduct, initialBatchSize])

  useEffect(() => {
    cleanupRelatedProductsCache()
  }, [])

  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    console.log(`🔄 Cargando más productos... Índice actual: ${currentIndex}`)

    setTimeout(() => {
      const nextBatch = allRelatedProducts.slice(currentIndex, currentIndex + loadMoreBatchSize)
      const newDisplayedProducts = [...displayedProducts, ...nextBatch]
      const newIndex = currentIndex + loadMoreBatchSize

      setDisplayedProducts(newDisplayedProducts)
      setCurrentIndex(newIndex)
      setHasMore(newIndex < allRelatedProducts.length)
      setLoadingMore(false)

      console.log(`✅ Cargados ${nextBatch.length} productos más`)
      console.log(`📦 Total mostrados: ${newDisplayedProducts.length}/${allRelatedProducts.length}`)
    }, 300)
  }, [allRelatedProducts, displayedProducts, currentIndex, loadMoreBatchSize, loadingMore, hasMore])

  useEffect(() => {
    if (!hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          console.log("🎯 Intersection detected - Loading more products...")
          loadMoreProducts()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loadMoreProducts])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: initialBatchSize }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg mb-3"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (allRelatedProducts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">No hay productos relacionados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {displayedProducts.map((product, index) => (
          <div
            key={product.id}
            className="opacity-0 animate-fade-in"
            style={{
              animationDelay: `${(index % loadMoreBatchSize) * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="flex flex-col items-center py-8">
          {loadingMore ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando más productos relacionados...</p>
            </div>
          ) : (
            <button
              onClick={loadMoreProducts}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg 
                       hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                       dark:focus:ring-offset-gray-900"
            >
              Cargar más productos ({allRelatedProducts.length - displayedProducts.length} restantes)
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}