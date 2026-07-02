"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
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
          <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto "></div>
        </div>
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {!products
              ? "Cargando ranking..."
              : "Próximamente tendremos nuestro ranking de productos más populares"}
          </p>
        </div>
      </section>
    )
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

  const rankedProducts = products.slice(0, 10)

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
        <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto "></div>
      </div>

      <div className="relative">
        {/* Vista móvil - Mejorada */}
        <div className="md:hidden">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {rankedProducts.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                prefetch={false}
                className="group relative min-w-0 cursor-pointer"
                title={product.name}
              >
                {/* Card container */}
                <div className={`relative overflow-hidden border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 ${getMedalBorder(i)}`}>
                  
                  {/* Número de ranking con diseño mejorado */}
                  <div className="absolute left-1 top-1 z-20">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border border-white bg-gradient-to-br shadow ${getMedalColor(i)} dark:border-gray-900`}>
                      <span className="text-[9px] font-bold text-white">#{i + 1}</span>
                    </div>
                  </div>

                  {/* Top 3 badge */}
                  {i < 3 && (
                    <div className="absolute right-1 top-1 z-20">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 drop-shadow" />
                    </div>
                  )}

                  {/* Imagen con aspect ratio fijo */}
                  <div
                    className="w-full bg-white p-1 dark:bg-gray-900"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-contain"
                        loading="lazy"
                        sizes="20vw"
                      />
                    </div>
                  </div>

                  {/* Nombre del producto */}
                  <div className="bg-gradient-to-b from-transparent to-gray-50 p-1 dark:to-gray-900/50">
                    <p
                      className="line-clamp-2 min-h-[24px] text-center text-[9px] font-medium leading-3 text-gray-900 dark:text-gray-100"
                      style={{ overflowWrap: "anywhere" }}
                    >
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
          {rankedProducts.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              prefetch={false}
              className="relative cursor-pointer group w-full"
              title={product.name}
            >
              {/* Card container */}
              <div className={`relative bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden
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
                      loading="lazy"
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

    </section>
  )
}

export default memo(RankingSection)
