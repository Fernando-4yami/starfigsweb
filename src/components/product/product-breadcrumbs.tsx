"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface ProductBreadcrumbsProps {
  category?: string
  productName: string
}

export default function ProductBreadcrumbs({ category, productName }: ProductBreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      {/* Home - siempre clickable */}
      <Link
        href="/"
        prefetch={false}
        className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Categoría - solo texto decorativo */}
      {category && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          <span className="text-gray-500 dark:text-gray-500 capitalize">
            {category}
          </span>
        </>
      )}

      {/* Producto actual - solo texto */}
      {category && <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />}
      <span className="text-blue-800 dark:text-blue-400 font-medium truncate max-w-[250px] md:max-w-[400px]" title={productName}>
        {productName}
      </span>
    </nav>
  )
}
