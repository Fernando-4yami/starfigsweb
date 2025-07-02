"use client"

import { Gift, Truck } from "lucide-react"

export default function PromotionBanner() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-center space-x-3">
        <div className="flex items-center space-x-2">
          <Truck className="w-5 h-5 text-green-600" />
          <Gift className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            🎉 <span className="text-green-700">¡ENVÍO GRATIS!</span> en compras de{" "}
            <span className="text-blue-700 font-bold">3 figuras o más</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Válido a nivel nacional
          </p>
        </div>
      </div>
    </div>
  )
}
