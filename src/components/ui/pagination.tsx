"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = (): (number | string)[] => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    pages.push(1)

    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)

    if (startPage > 2) {
      pages.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    if (endPage < totalPages - 1) {
      pages.push("...")
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Botón Anterior */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 
                   bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md 
                   hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Números de página */}
      <div className="flex items-center space-x-1">
        {visiblePages.map((page, index) => {
          if (typeof page === "string") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500 dark:text-gray-400">
                {page}
              </span>
            )
          }

          const pageNumber = page
          const isActive = pageNumber === currentPage

          return (
            <button
              key={`page-${pageNumber}`}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                  : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {pageNumber}
            </button>
          )
        })}
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 
                   bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md 
                   hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook para manejar paginación
export function usePagination<T>(items: T[], itemsPerPage: number) {
  const totalPages = Math.ceil(items.length / itemsPerPage)

  const getPaginatedItems = (currentPage: number): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  const getPaginationInfo = (currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, items.length)

    return {
      startIndex: startIndex + 1,
      endIndex,
      totalItems: items.length,
      totalPages,
    }
  }

  return {
    totalPages,
    getPaginatedItems,
    getPaginationInfo,
  }
}