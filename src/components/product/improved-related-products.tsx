"use client"

import { getProducts, type Product } from "@/lib/firebase/products"
import { useState, useEffect } from "react"
import ProductCard from "@/components/ProductCard"
import type { SerializedProduct } from "@/lib/serialize-product"

interface StrictRelatedProductsProps {
  currentProduct: SerializedProduct | Product
  maxProducts?: number
}

// 🎯 FUNCIÓN PARA EXTRAER SERIES DE FORMA MÁS PRECISA
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
    "That Time I Got Reincarnated as a Slime",
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

  // 🎯 BÚSQUEDA EXACTA DE SERIES
  commonSeries.forEach((series) => {
    const seriesLower = series.toLowerCase()

    // Verificar si la serie está presente de forma completa en el nombre
    if (nameLower.includes(seriesLower)) {
      foundSeries.push(series)
    }
  })

  return foundSeries
}

// 🎯 FUNCIÓN PARA VERIFICAR COINCIDENCIA EXACTA DE LÍNEA
function isExactLineMatch(line1: string, line2: string): boolean {
  if (!line1 || !line2) return false

  const normalize = (str: string) => str.toLowerCase().trim()
  const normalizedLine1 = normalize(line1)
  const normalizedLine2 = normalize(line2)

  // Coincidencia exacta
  return normalizedLine1 === normalizedLine2
}

// 🎯 FUNCIÓN PARA VERIFICAR COINCIDENCIA DE SERIE
function hasSeriesMatch(series1: string[], series2: string[]): boolean {
  if (series1.length === 0 || series2.length === 0) return false

  return series1.some((s1) => series2.some((s2) => s1.toLowerCase() === s2.toLowerCase()))
}

export default function StrictRelatedProducts({ currentProduct, maxProducts = 8 }: StrictRelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStrictRelatedProducts = async () => {
      try {

        const allProducts = await getProducts(200)

        // Extraer información del producto actual
        const currentLine = currentProduct.line || ""
        const currentSeries = extractSeries(currentProduct.name)

        console.log(`📋 Producto actual:`)
        console.log(`  - Línea: "${currentLine}"`)
        console.log(`  - Series detectadas: [${currentSeries.join(", ")}]`)

        // 🎯 FILTRADO ESTRICTO: Solo productos que coincidan en línea O serie
        const strictMatches = allProducts
          .filter((product) => product.slug !== currentProduct.slug)
          .map((product) => {
            const productLine = product.line || ""
            const productSeries = extractSeries(product.name)

            // ✅ VERIFICAR COINCIDENCIAS ESTRICTAS
            const lineMatch = isExactLineMatch(currentLine, productLine)
            const seriesMatch = hasSeriesMatch(currentSeries, productSeries)

            // 🚫 RECHAZAR si no coincide en NINGUNO
            if (!lineMatch && !seriesMatch) {
              return null
            }

            // 🎯 CALCULAR PUNTUACIÓN BASADA EN COINCIDENCIAS
            let score = 0
            const reasons: string[] = []

            if (lineMatch && seriesMatch) {
              score = 100 // Máxima prioridad: coincide en ambos
              reasons.push(`línea Y serie: "${productLine}" + [${productSeries.join(", ")}]`)
            } else if (lineMatch) {
              score = 80 // Alta prioridad: solo línea
              reasons.push(`línea exacta: "${productLine}"`)
            } else if (seriesMatch) {
              score = 60 // Media prioridad: solo serie
              const matchedSeries = currentSeries.filter((s1) =>
                productSeries.some((s2) => s1.toLowerCase() === s2.toLowerCase()),
              )
              reasons.push(`serie: [${matchedSeries.join(", ")}]`)
            }

            // 🎯 BONUS MENOR POR OTROS FACTORES
            if (currentProduct.brand && product.brand === currentProduct.brand) {
              score += 5
              reasons.push(`misma marca: "${product.brand}"`)
            }

            if (product.views && product.views > 10) {
              score += Math.min(Math.floor(product.views / 20), 5)
              reasons.push(`popular: ${product.views} vistas`)
            }

            return {
              product,
              score,
              reasons,
              lineMatch,
              seriesMatch,
            }
          })
          .filter(Boolean) // Remover nulls
          .sort((a, b) => b!.score - a!.score) // Ordenar por puntuación
          .slice(0, maxProducts)

        const finalProducts = strictMatches.map((item) => item!.product)
        setRelatedProducts(finalProducts)

        strictMatches.forEach((item, index) => {
          const { product, score, reasons, lineMatch, seriesMatch } = item!
          const matchType = lineMatch && seriesMatch ? "AMBOS" : lineMatch ? "LÍNEA" : "SERIE"
          console.log(`  ${index + 1}. [${matchType}] ${product.name} (Score: ${score})`)
          console.log(`     Razones: ${reasons.join(", ")}`)
        })

        if (finalProducts.length === 0) {
          console.log(`⚠️ No se encontraron productos que coincidan exactamente en línea o serie`)
        }
      } catch (error) {
        console.error("Error fetching strict related products:", error)
        setRelatedProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchStrictRelatedProducts()
  }, [currentProduct, maxProducts])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (relatedProducts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg font-medium mb-2">No hay productos relacionados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {relatedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
