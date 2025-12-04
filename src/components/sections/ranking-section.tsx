"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { incrementProductViews } from "@/lib/firebase/products"
import type { Product } from "@/lib/firebase/products"
import { Trophy, Star } from "lucide-react"

interface RankingSectionProps {
  products: Product[]
}

function RankingSection({ products }: RankingSectionProps) {
  // 🎯 Si no hay productos
  if (!products || !Array.isArray(products) || products.length === 0) {
    return (
      <section className="mb-16">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 text-center">
              Ranking
            </h2>
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full"></div>
        </div>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {!products
              ? "Cargando ranking..."
              : "Próximamente tendremos nuestro ranking de productos más populares"}
          </p>
        </div>
      </section>
    )
  }

  // 🚀 Click handler
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

  // 🎨 Colores de medallas
  const getMedalColor = (index: number) => {
    if (index === 0) return "from-yellow-400 to-yellow-600" // Oro
    if (index === 1) return "from-gray-300 to-gray-500" // Plata
    if (index === 2) return "from-orange-400 to-orange-600" // Bronce
    return "from-blue-500 to-blue-700" // Resto
  }

  const getMedalBorder = (index: number) => {
    if (index === 0) return "border-yellow-400 dark:border-yellow-500"
    if (index === 1) return "border-gray-400 dark:border-gray-500"
    if (index === 2) return "border-orange-400 dark:border-orange-500"
    return "border-blue-400 dark:border-blue-500"
  }

  return (
    <section className="mb-16">
      {/* Encabezado con icono */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            Ranking
          </h2>
        </div>
        <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full"></div>
      </div>

      <div className="relative">
        {/* Vista móvil - Mejorada */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto gap-4 pb-4 px-4 scroll-smooth scrollbar-hide touch-pan-x">
            {products.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="relative flex-shrink-0 cursor-pointer group"
                title={product.name}
                onClick={() => handleRankingClick(product)}
              >
                {/* Card container */}
                <div className={`relative w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg 
                              hover:shadow-2xl transition-all duration-300 overflow-hidden
                              border-2 ${getMedalBorder(i)} group-hover:scale-105`}>
                  
                  {/* Número de ranking con diseño mejorado */}
                  <div className="absolute top-2 left-2 z-20">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMedalColor(i)} 
                                  flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900`}>
                      <span className="text-white font-bold text-sm">#{i + 1}</span>
                    </div>
                  </div>

                  {/* Top 3 badge */}
                  {i < 3 && (
                    <div className="absolute top-2 right-2 z-20">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-lg" />
                    </div>
                  )}

                  {/* Imagen con aspect ratio fijo */}
                  <div className="w-full h-40 bg-white dark:bg-gray-900 p-2">
                    <div className="relative w-full h-full">
                      <Image
                        src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-contain"
                        loading={i < 3 ? "eager" : "lazy"}
                        sizes="160px"
                      />
                    </div>
                  </div>

                  {/* Nombre del producto */}
                  <div className="p-3 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/50">
                    <p className="text-center text-gray-900 dark:text-gray-100 font-semibold text-xs 
                                leading-tight line-clamp-2 min-h-[32px]">
                      {product.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Vista desktop - Mejorada */}
        <div className="hidden md:grid md:grid-cols-5 lg:grid-cols-10 gap-4 justify-items-center">
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="relative cursor-pointer group w-full"
              title={product.name}
              onClick={() => handleRankingClick(product)}
            >
              {/* Card container */}
              <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg 
                            hover:shadow-2xl transition-all duration-300 overflow-hidden
                            border-2 ${getMedalBorder(i)} group-hover:scale-105`}>
                
                {/* Número de ranking */}
                <div className="absolute top-2 left-2 z-20">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getMedalColor(i)} 
                                flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900`}>
                    <span className="text-white font-bold text-xs">#{i + 1}</span>
                  </div>
                </div>

                {/* Top 3 badge */}
                {i < 3 && (
                  <div className="absolute top-2 right-2 z-20">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-lg" />
                  </div>
                )}

                {/* Imagen con aspect ratio fijo */}
                <div className="w-full h-32 bg-white dark:bg-gray-900 p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-contain"
                      loading={i < 5 ? "eager" : "lazy"}
                      sizes="128px"
                    />
                  </div>
                </div>

                {/* Nombre del producto */}
                <div className="p-2 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/50">
                  <p className="text-center text-gray-900 dark:text-gray-100 font-medium text-xs 
                              leading-tight line-clamp-2 min-h-[32px]">
                    {product.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Estilos para ocultar scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}

export default memo(RankingSection)