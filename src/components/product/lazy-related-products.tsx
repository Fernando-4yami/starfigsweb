"use client"

import { useState, useEffect, useRef } from "react"
import { getProducts, type Product } from "@/lib/firebase/products"
import ProductCard from "@/components/ProductCard"
import type { SerializedProduct } from "@/lib/serialize-product"

interface LazyRelatedProductsProps {
  products?: any[] // Mantener compatibilidad con el uso anterior
  productLine?: string
  currentProduct?: SerializedProduct | Product // Aceptar ambos tipos
  maxProducts?: number
}

// Función para calcular similitud entre nombres
function calculateNameSimilarity(name1: string, name2: string): number {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remover puntuación
      .split(/\s+/)
      .filter((word) => word.length > 2) // Solo palabras de 3+ caracteres

  const words1 = normalize(name1)
  const words2 = normalize(name2)

  if (words1.length === 0 || words2.length === 0) return 0

  let matches = 0
  words1.forEach((word1) => {
    if (words2.some((word2) => word1.includes(word2) || word2.includes(word1) || word1 === word2)) {
      matches++
    }
  })

  return matches / Math.max(words1.length, words2.length)
}

// Función para extraer serie del nombre del producto
function extractSeries(productName: string): string[] {
  const commonSeries = [
    "One Piece",
    "Dragon Ball",
    "Boku no Hero Academia",
    "My Hero Academia",
    "Kimetsu no Yaiba",
    "Demon Slayer",
    "Gotoubun no Hanayome",
    "Quintessential Quintuplets",
    "Evangelion",
    "Jujutsu Kaisen",
    "Re:Zero",
    "SPY x FAMILY",
    "Spy Family",
    "Tensei Shitara Slime",
    "Naruto",
    "Attack on Titan",
    "Shingeki no Kyojin",
    "Tokyo Revengers",
    "Chainsaw Man",
    "Bleach",
    "Hunter x Hunter",
    "Mob Psycho",
    "Overlord",
    "Konosuba",
    "Fate",
    "Hololive",
    "Pokemon",
    "Digimon",
    "Sailor Moon",
    "Cardcaptor Sakura",
    "Love Live",
    "Vocaloid",
    "Hatsune Miku",
  ]

  const foundSeries: string[] = []
  const nameLower = productName.toLowerCase()

  commonSeries.forEach((series) => {
    if (nameLower.includes(series.toLowerCase())) {
      foundSeries.push(series)
    }
  })

  return foundSeries
}

export default function LazyRelatedProducts({
  products: initialProducts,
  productLine,
  currentProduct,
  maxProducts = 8,
}: LazyRelatedProductsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [loadedProducts, setLoadedProducts] = useState<Set<number>>(new Set())
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // 🚀 INTERSECTION OBSERVER
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Cargar 100px antes de ser visible
      },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // 🔍 BUSCAR PRODUCTOS RELACIONADOS MEJORADOS
  useEffect(() => {
    if (!isVisible || !currentProduct) return
    if (initialProducts && initialProducts.length > 0) {
      // Si ya tenemos productos, usar esos
      setRelatedProducts(initialProducts.slice(0, maxProducts))
      return
    }

    const fetchImprovedRelatedProducts = async () => {
      try {
        setLoading(true)
        console.log(`🔍 Buscando productos relacionados mejorados para: "${currentProduct.name}"`)

        const allProducts = await getProducts(200) // Pool de búsqueda amplio

        // Extraer información del producto actual
        const currentSeries = extractSeries(currentProduct.name)
        const currentLine = currentProduct.line || ""
        const currentBrand = currentProduct.brand || ""

        console.log(
          `📋 Producto actual - Serie: ${currentSeries.join(", ")}, Línea: "${currentLine}", Marca: "${currentBrand}"`,
        )

        // Calcular puntuación de relevancia para cada producto
        const scoredProducts = allProducts
          .filter((p) => p.slug !== currentProduct.slug) // Excluir el producto actual
          .map((product) => {
            let score = 0
            const reasons: string[] = []

            // 1. Coincidencia exacta de línea (peso alto)
            if (currentLine && product.line === currentLine) {
              score += 50
              reasons.push(`misma línea: "${currentLine}"`)
            }

            // 2. Coincidencia de marca (peso medio)
            if (currentBrand && product.brand === currentBrand) {
              score += 20
              reasons.push(`misma marca: "${currentBrand}"`)
            }

            // 3. Coincidencia de serie (peso alto)
            const productSeries = extractSeries(product.name)
            const seriesMatch = currentSeries.some((series) =>
              productSeries.some((pSeries) => series.toLowerCase() === pSeries.toLowerCase()),
            )
            if (seriesMatch) {
              score += 40
              const matchedSeries = currentSeries.filter((series) =>
                productSeries.some((pSeries) => series.toLowerCase() === pSeries.toLowerCase()),
              )
              reasons.push(`misma serie: ${matchedSeries.join(", ")}`)
            }

            // 4. Similitud de nombre (peso variable)
            const nameSimilarity = calculateNameSimilarity(currentProduct.name, product.name)
            if (nameSimilarity > 0.3) {
              score += Math.floor(nameSimilarity * 30)
              reasons.push(`similitud de nombre: ${Math.floor(nameSimilarity * 100)}%`)
            }

            // 5. Misma categoría (peso bajo)
            if (currentProduct.category && product.category === currentProduct.category) {
              score += 10
              reasons.push(`misma categoría: "${product.category}"`)
            }

            // 6. Rango de precio similar (peso bajo)
            const priceDiff = Math.abs(currentProduct.price - product.price)
            const priceRatio = priceDiff / Math.max(currentProduct.price, product.price)
            if (priceRatio < 0.5) {
              score += Math.floor((1 - priceRatio) * 15)
              reasons.push(`precio similar: S/.${product.price}`)
            }

            // 7. Bonus por popularidad (vistas)
            if (product.views && product.views > 10) {
              score += Math.min(Math.floor(product.views / 10), 10)
              reasons.push(`popular: ${product.views} vistas`)
            }

            return {
              product: product, // Usar el producto original sin serializar
              score,
              reasons,
            }
          })
          .filter((item) => item.score > 15) // Solo productos con puntuación mínima
          .sort((a, b) => b.score - a.score) // Ordenar por puntuación descendente
          .slice(0, maxProducts)

        const finalProducts = scoredProducts.map((item) => item.product)
        setRelatedProducts(finalProducts)

        console.log(`✅ Encontrados ${finalProducts.length} productos relacionados mejorados:`)
        scoredProducts.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.product.name} (Score: ${item.score}) - ${item.reasons.join(", ")}`)
        })
      } catch (error) {
        console.error("Error fetching improved related products:", error)
        setRelatedProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchImprovedRelatedProducts()
  }, [isVisible, currentProduct, initialProducts, maxProducts])

  // 🚀 CARGAR PRODUCTOS PROGRESIVAMENTE
  useEffect(() => {
    if (!isVisible || relatedProducts.length === 0) return

    const loadProducts = async () => {
      for (let i = 0; i < relatedProducts.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i)) // Stagger loading
        setLoadedProducts((prev) => new Set([...prev, i]))
      }
    }

    loadProducts()
  }, [isVisible, relatedProducts.length])

  // Usar productos iniciales si no hay currentProduct
  const productsToShow = relatedProducts.length > 0 ? relatedProducts : initialProducts || []

  if (loading) {
    return (
      <div ref={sectionRef} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (productsToShow.length === 0) {
    return (
      <div ref={sectionRef} className="text-center py-8 bg-gray-50 rounded-lg">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No hay productos relacionados disponibles</p>
          <p className="text-sm">Intenta explorar otras categorías</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productsToShow.map((product, index) => {
          const isLoaded = loadedProducts.has(index)
          return (
            <div
              key={product.slug}
              className={`transition-all duration-500 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {isVisible && isLoaded ? (
                <ProductCard product={product} />
              ) : (
                <div className="bg-gray-100 rounded-xl p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === "development" && currentProduct && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          <p>
            <strong>Debug:</strong> Productos relacionados para "{currentProduct.name}"
          </p>
          <p>
            Línea: {currentProduct.line || "N/A"} | Marca: {currentProduct.brand || "N/A"}
          </p>
          <p>Encontrados: {productsToShow.length} productos</p>
        </div>
      )}
    </div>
  )
}
