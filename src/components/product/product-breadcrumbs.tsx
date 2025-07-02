"use client"

import { ChevronRight, Home } from "lucide-react"

interface ProductBreadcrumbsProps {
  category?: string
  productName: string
}

export default function ProductBreadcrumbs({ category, productName }: ProductBreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      <a href="/" className="flex items-center hover:text-blue-600 transition-colors">
        <Home className="w-4 h-4" />
      </a>
      <ChevronRight className="w-4 h-4" />
      <a  className="hover:text-blue-600 transition-colors">
        Productos
      </a>
      {category && (
        <>
          <ChevronRight className="w-4 h-4" />
          <a
            
            className="hover:text-blue-600 transition-colors"
          >
            {category}
          </a>
        </>
      )}
      <ChevronRight className="w-4 h-4" />
      <span className="text-blue-800 font-medium truncate">{productName}</span>
    </nav>
  )
}
