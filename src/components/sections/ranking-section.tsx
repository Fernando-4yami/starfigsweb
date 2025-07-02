"use client"

import { memo } from "react"
import Link from "next/link"
import { incrementProductViews } from "@/lib/firebase/products"
import type { Product } from "@/lib/firebase/products"

interface RankingSectionProps {
  products: Product[]
}

function RankingSection({ products }: RankingSectionProps) {
  // 🎯 SOLUCIÓN: Verificar que products existe y es un array
  if (!products || !Array.isArray(products) || products.length === 0) {
    return (
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 text-center">Ranking Semanal</h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {!products ? "Cargando ranking..." : "Próximamente tendremos nuestro ranking de productos más populares"}
          </p>
        </div>
      </section>
    )
  }

  // 🚀 FUNCIÓN PARA MANEJAR CLICKS EN RANKING
  const handleRankingClick = (product: Product) => {
    try {
      console.log(`🏆 Click en ranking para: ${product.id} - ${product.name}`)

      incrementProductViews(product.id)
        .then(() => {
          console.log(`✅ Views incrementadas desde ranking: ${product.name}`)
        })
        .catch((error) => {
          console.error(`❌ Error incrementando views desde ranking:`, error)
        })
    } catch (error) {
      console.error("Error en handleRankingClick:", error)
    }
  }

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 text-center">Ranking Semanal</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>
     

      <div className="relative">
        {/* Vista móvil */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto gap-4 pb-4 px-4 scroll-smooth scrollbar-hide touch-pan-x">
            {products.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="relative flex-shrink-0 cursor-pointer"
                title={product.name}
                onClick={() => handleRankingClick(product)}
              >
                <div className="absolute top-2 left-2 z-20 bg-gradient-to-br from-blue-600 to-blue-800 text-amber-300 font-bold text-sm w-8 h-8 flex items-center justify-center transform rotate-45 shadow-lg border border-amber-400">
                  <span className="transform -rotate-45">#{i + 1}</span>
                </div>

                <div className="w-40 h-40 overflow-hidden rounded-lg shadow-xl border border-blue-200 relative">
                  <img
                    src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-contain bg-white"
                    loading={i < 3 ? "eager" : "lazy"}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                </div>

                <p className="mt-3 text-center text-gray-900 font-semibold text-sm leading-tight line-clamp-2 w-40">
                  {product.name}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Vista desktop */}
        <div className="hidden md:grid md:grid-cols-5 lg:grid-cols-10 gap-4">
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="relative cursor-pointer group"
              title={product.name}
              onClick={() => handleRankingClick(product)}
            >
              <div className="absolute -top-2 -left-2 z-20 bg-gradient-to-br from-blue-600 to-blue-800 text-amber-300 font-bold text-xs w-7 h-7 flex items-center justify-center transform rotate-45 shadow-lg border-2 border-amber-400">
                <span className="transform -rotate-45">#{i + 1}</span>
              </div>

              <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-lg border border-blue-200 group-hover:shadow-xl transition-shadow duration-300">
                <img
                  src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-contain bg-white"
                  loading={i < 5 ? "eager" : "lazy"}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>

              <p className="mt-2 text-center text-gray-900 font-medium text-xs leading-tight line-clamp-2">
                {product.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(RankingSection)
