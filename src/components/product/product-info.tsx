"use client"

import { useState } from "react"
import { Calendar, Tag, Info, Package } from "lucide-react"
import { calculateFinalPrice, hasActiveDiscount, getDiscountPercentage, isInStock } from "@/lib/serialize-product"

interface ProductInfoProps {
  name: string
  price: number
  category?: string
  releaseDate?: any
  showReleaseTag: boolean
  releaseMonthYear: string
  stock?: number
  lowStockThreshold?: number
  discount?: {
    isActive: boolean
    type: "percentage" | "fixed"
    value: number
    startDate?: string | null
    endDate?: string | null
  }
}

export default function ProductInfo({
  name,
  price,
  category,
  releaseDate,
  showReleaseTag,
  releaseMonthYear,
  stock,
  lowStockThreshold = 5,
  discount,
}: ProductInfoProps) {
  const [showPriceTooltip, setShowPriceTooltip] = useState(false)

  console.log("[v0] ProductInfo received props:", {
    name,
    stock,
    discount,
    showReleaseTag,
    lowStockThreshold,
  })

  const productForCalc = { price, stock, discount } as any
  const finalPrice = calculateFinalPrice(productForCalc)
  const hasDiscount = hasActiveDiscount(productForCalc)
  const discountPercent = getDiscountPercentage(productForCalc)
  const inStock = isInStock(productForCalc)
  const isLowStock = stock !== undefined && stock > 0 && stock <= lowStockThreshold

  const shouldShowStock = stock !== undefined && stock !== null && stock > 0

  console.log("[v0] Calculated values:", {
    finalPrice,
    hasDiscount,
    discountPercent,
    inStock,
    isLowStock,
    shouldShowStock,
  })

  return (
    <div className="space-y-6">
      {/* Título */}
      <h1 className="text-3xl lg:text-4xl font-bold text-blue-800 dark:text-blue-400 leading-tight">{name}</h1>

      {/* Badges y fecha */}
      <div className="flex flex-wrap items-center gap-3">
        {showReleaseTag && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide 
                         bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 
                         text-white px-3 py-1 rounded-full shadow border border-pink-300 dark:border-pink-700">
            ✨ Pre-venta
          </span>
        )}
        {hasDiscount && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide 
                         bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500 
                         text-white px-3 py-1 rounded-full shadow border border-orange-300 dark:border-orange-700">
            <Tag className="w-3 h-3" />
            {discountPercent}% OFF
          </span>
        )}
        {category && (
          <span className="inline-flex items-center gap-1 text-xs font-medium border 
                         border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 
                         px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30">
            <Tag className="w-3 h-3" />
            {category}
          </span>
        )}
        {releaseMonthYear && (
          <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
            <Calendar className="w-4 h-4" />
            {releaseMonthYear}
          </div>
        )}
      </div>

      {shouldShowStock && (
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className={`text-sm font-medium ${
            isLowStock ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
          }`}>
            {isLowStock ? `¡Solo quedan ${stock} unidades!` : "En stock"}
          </span>
        </div>
      )}

      {/* Precio */}
      {price > 0 && (
        <div className="space-y-4">
          {hasDiscount ? (
            <div className="space-y-2">
              {/* Original price crossed out */}
              <div className="flex items-center gap-2">
                <p className="text-xl font-medium text-gray-400 dark:text-gray-500 line-through">
                  S/. {price.toFixed(2)}
                </p>
              </div>
              {/* Discounted price */}
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">S/. {finalPrice.toFixed(2)}</p>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowPriceTooltip(true)}
                    onMouseLeave={() => setShowPriceTooltip(false)}
                    onClick={() => setShowPriceTooltip(!showPriceTooltip)}
                    className="flex items-center justify-center w-5 h-5 bg-gray-100 dark:bg-gray-800 
                             hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 
                             hover:text-gray-800 dark:hover:text-gray-200 rounded-full transition-colors duration-200"
                    aria-label="Información sobre precios"
                  >
                    <Info className="w-3 h-3" />
                  </button>

                  {showPriceTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                      <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg w-48">
                        <div className="text-center leading-relaxed">
                          Precio con descuento aplicado.
                          <br />
                          Ahorras S/. {(price - finalPrice).toFixed(2)}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 
                                      border-l-4 border-r-4 border-t-4 border-transparent 
                                      border-t-gray-800 dark:border-t-gray-700"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">S/. {price.toFixed(2)}</p>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowPriceTooltip(true)}
                  onMouseLeave={() => setShowPriceTooltip(false)}
                  onClick={() => setShowPriceTooltip(!showPriceTooltip)}
                  className="flex items-center justify-center w-5 h-5 bg-gray-100 dark:bg-gray-800 
                           hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 
                           hover:text-gray-800 dark:hover:text-gray-200 rounded-full transition-colors duration-200"
                  aria-label="Información sobre precios"
                >
                  <Info className="w-3 h-3" />
                </button>

                {showPriceTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                    <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg w-48">
                      <div className="text-center leading-relaxed">
                        Precio de fecha de lanzamiento.
                        <br />
                        Puede variar según disponibilidad
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 
                                    border-l-4 border-r-4 border-t-4 border-transparent 
                                    border-t-gray-800 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}