"use client"

import { useMemo, useState } from "react"
import ProductCard from "@/components/ProductCard"
import { ChevronRight, Home, Package } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/lib/firebase/products"

interface LinesClientProps {
  lineName: string
  products: Product[]
}

export default function LinesClient({ lineName, products }: LinesClientProps) {
  const [sortBy, setSortBy] = useState<string>("newest")

  const sortedProducts = useMemo(() => {
    const sorted = [...products]
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      case "oldest":
        return sorted.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0))
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price)
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price)
      default:
        return sorted
    }
  }, [products, sortBy])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <Link href="/" className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400 dark:text-gray-500">Líneas</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">{lineName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {lineName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {products.length} {products.length === 1 ? "producto disponible" : "productos disponibles"} en la línea {lineName}
          </p>
        </div>

        {/* Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
            <span className="font-semibold">{products.length} productos</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ordenar:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="price-low">Precio: menor a mayor</option>
              <option value="price-high">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No hay productos disponibles para la línea {lineName} en este momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {sortedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 12} />
            ))}
          </div>
        )}

        {/* SEO Text */}
        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="max-w-3xl mx-auto leading-relaxed">
            Compra figuras de la línea {lineName} en preventa en Starfigs Perú.
            Todas nuestras figuras son originales importadas con envío gratis a todo el Perú por Agencias Shalom.
          </p>
        </div>
      </div>
    </div>
  )
}
