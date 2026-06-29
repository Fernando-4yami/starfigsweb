"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type {
  Product,
  Filters,
  CategoryConfig,
  SortOption,
} from "@/types/category"

const getItemsPerPage = () => {
  if (typeof window === "undefined") return 20

  const width = window.innerWidth
  if (width >= 1280) return 20
  if (width >= 768) return 16
  if (width >= 640) return 12
  return 8
}

interface CategoryFilterOptions {
  brands: string[]
  categories: string[]
  scales: string[]
  lines: string[]
  series: string[]
  priceRange: { min: number; max: number }
  counts: {
    brands: Record<string, number>
    categories: Record<string, number>
    scales: Record<string, number>
    lines: Record<string, number>
    series: Record<string, number>
  }
}

const EMPTY_FILTER_OPTIONS: CategoryFilterOptions = {
  brands: [],
  categories: [],
  scales: [],
  lines: [],
  series: [],
  priceRange: { min: 0, max: 1000 },
  counts: {
    brands: {},
    categories: {},
    scales: {},
    lines: {},
    series: {},
  },
}

export function useCategoryProducts(config: CategoryConfig) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortByState] = useState<SortOption>("newest")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [filterOptions, setFilterOptions] =
    useState<CategoryFilterOptions>(EMPTY_FILTER_OPTIONS)

  const resultsRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<Filters>({
    brands: [],
    categories: [],
    series: [],
    priceRange: { min: 0, max: 1000 },
    heightRange: { min: 0, max: 50 },
    scales: [],
    lines: [],
    hasReleaseDate: null,
  })

  useEffect(() => {
    const updateItemsPerPage = () => {
      const nextItemsPerPage = getItemsPerPage()
      setItemsPerPage(nextItemsPerPage)
      setCurrentPage(1)
    }

    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)
    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          sort: sortBy,
          minPrice: String(filters.priceRange.min),
          maxPrice: String(filters.priceRange.max),
          minHeight: String(filters.heightRange.min),
          maxHeight: String(filters.heightRange.max),
        })

        filters.brands.forEach((value) => params.append("brand", value))
        filters.categories.forEach((value) => params.append("category", value))
        filters.series.forEach((value) => params.append("series", value))
        filters.scales.forEach((value) => params.append("scale", value))
        filters.lines.forEach((value) => params.append("line", value))

        if (filters.hasReleaseDate === true) {
          params.set("availability", "future")
        } else if (filters.hasReleaseDate === false) {
          params.set("availability", "released")
        }

        const response = await fetch(
          `/api/categories/${config.slug}?${params.toString()}`,
          { signal: controller.signal },
        )
        if (!response.ok) {
          throw new Error(`Category request failed: ${response.status}`)
        }

        const payload = await response.json()
        const pageProducts: Product[] = payload.products.map((product: any) => ({
          ...product,
          createdAt: product.createdAt ? new Date(product.createdAt) : null,
          releaseDate: product.releaseDate
            ? new Date(product.releaseDate)
            : null,
          lastViewedAt: product.lastViewedAt
            ? new Date(product.lastViewedAt)
            : null,
          discount: product.discount
            ? {
                ...product.discount,
                startDate: product.discount.startDate
                  ? new Date(product.discount.startDate)
                  : null,
                endDate: product.discount.endDate
                  ? new Date(product.discount.endDate)
                  : null,
              }
            : undefined,
        }))

        setProducts(pageProducts)
        setTotalItems(payload.total)
        setTotalPages(payload.totalPages)
        setFilterOptions(payload.filterOptions || EMPTY_FILTER_OPTIONS)
        if (payload.page !== currentPage) setCurrentPage(payload.page)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error(`Error cargando productos ${config.name}:`, error)
        setProducts([])
        setTotalItems(0)
        setTotalPages(1)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 150)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [config.name, config.slug, currentPage, filters, itemsPerPage, sortBy])

  const paginationInfo = useMemo(() => {
    if (totalItems === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        totalItems: 0,
        currentPage,
        totalPages,
      }
    }

    const startIndex = (currentPage - 1) * itemsPerPage
    return {
      startIndex: startIndex + 1,
      endIndex: Math.min(startIndex + products.length, totalItems),
      totalItems,
      currentPage,
      totalPages,
    }
  }, [currentPage, itemsPerPage, products.length, totalItems, totalPages])

  const handlePageChange = (newPage: number) => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    setCurrentPage(newPage)
  }

  const handleFilterChange = (filterType: keyof Filters, value: any) => {
    setCurrentPage(1)
    setFilters((previous) => ({
      ...previous,
      [filterType]: value,
    }))
  }

  const clearAllFilters = () => {
    setCurrentPage(1)
    setFilters({
      brands: [],
      categories: [],
      series: [],
      priceRange: { min: 0, max: 1000 },
      heightRange: { min: 0, max: 50 },
      scales: [],
      lines: [],
      hasReleaseDate: null,
    })
  }

  const setSortBy = (value: SortOption) => {
    setCurrentPage(1)
    setSortByState(value)
  }

  const activeFiltersCount =
    filters.brands.length +
    filters.categories.length +
    filters.series.length +
    filters.scales.length +
    filters.lines.length +
    (filters.hasReleaseDate !== null ? 1 : 0)

  return {
    products,
    loading,
    sortBy,
    setSortBy,
    showMobileFilters,
    setShowMobileFilters,
    filters,
    handleFilterChange,
    clearAllFilters,
    activeFiltersCount,
    filterOptions,
    filteredProducts: products,
    sortedProducts: products,
    paginatedProducts: products,
    currentPage,
    setCurrentPage: handlePageChange,
    totalPages,
    itemsPerPage,
    paginationInfo,
    resultsRef,
  }
}
