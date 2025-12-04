"use client"

import { Building2, Package, Ruler, Tag } from "lucide-react"

interface ProductSpecsProps {
  brand?: string
  line?: string
  heightCm?: number
  scale?: string
}

export default function ProductSpecs({ brand, line, heightCm, scale }: ProductSpecsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
      {brand && (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Fabricante:</span>
            <span className="font-medium ml-1 text-blue-800 dark:text-blue-300">{brand}</span>
          </span>
        </div>
      )}

      {line && (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Línea:</span>
            <span className="font-medium ml-1 text-blue-800 dark:text-blue-300">{line}</span>
          </span>
        </div>
      )}

      {heightCm && (
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Altura:</span>
            <span className="font-medium ml-1 text-blue-800 dark:text-blue-300">{heightCm} cm aprox.</span>
          </span>
        </div>
      )}

      {scale && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm">
            <span className="text-blue-600 dark:text-blue-400">Escala:</span>
            <span className="font-medium ml-1 text-blue-800 dark:text-blue-300">{scale}</span>
          </span>
        </div>
      )}
    </div>
  )
}