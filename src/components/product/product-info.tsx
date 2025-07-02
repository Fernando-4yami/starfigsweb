"use client"

import { useState } from "react"
import { Calendar, Tag, Info, Truck, Gift } from "lucide-react"

interface ProductInfoProps {
  name: string
  price: number
  category?: string
  releaseDate?: any // 🔧 TEMPORAL
  showReleaseTag: boolean
  releaseMonthYear: string
}

export default function ProductInfo({
  name,
  price,
  category,
  releaseDate,
  showReleaseTag,
  releaseMonthYear,
}: ProductInfoProps) {
  const [showPriceTooltip, setShowPriceTooltip] = useState(false)

  return (
    <div className="space-y-6">
      {/* Título */}
      <h1 className="text-3xl lg:text-4xl font-bold text-blue-800 leading-tight">{name}</h1>

      {/* Badges y fecha */}
      <div className="flex flex-wrap items-center gap-3">
        {showReleaseTag && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full shadow border border-pink-300">
            ✨ Pre-venta
          </span>
        )}
        {category && (
          <span className="inline-flex items-center gap-1 text-xs font-medium border border-blue-300 text-blue-700 px-2 py-1 rounded-full">
            <Tag className="w-3 h-3" />
            {category}
          </span>
        )}
        {releaseMonthYear && (
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <Calendar className="w-4 h-4" />
            {releaseMonthYear}
          </div>
        )}
      </div>

      {/* Precio */}
      {price > 0 && (
        <div className="space-y-4">
          {/* Precio y tooltip */}
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-orange-600">S/. {price.toFixed(2)}</p>
            <div className="relative">
              <button
                onMouseEnter={() => setShowPriceTooltip(true)}
                onMouseLeave={() => setShowPriceTooltip(false)}
                onClick={() => setShowPriceTooltip(!showPriceTooltip)}
                className="flex items-center justify-center w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full transition-colors duration-200"
                aria-label="Información sobre precios"
              >
                <Info className="w-3 h-3" />
              </button>

              {showPriceTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                  <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg w-48">
                    <div className="text-center leading-relaxed">
                      Precio de fecha de lanzamiento.
                      <br />
                      Puede variar según disponibilidad
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

         
        </div>
      )}

 
    </div>
  )
}
