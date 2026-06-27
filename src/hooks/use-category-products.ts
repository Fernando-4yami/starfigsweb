"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import type { Product, Filters, CategoryConfig, SortOption } from "@/types/category"

// 🎯 CALCULAR PRODUCTOS POR PÁGINA RESPONSIVO (4 filas)
const getItemsPerPage = () => {
  if (typeof window === "undefined") return 20 // SSR fallback

  const width = window.innerWidth

  if (width >= 1280) return 20 // xl: 5 cols × 4 rows = 20
  if (width >= 768) return 16 // md: 4 cols × 4 rows = 16
  if (width >= 640) return 12 // sm: 3 cols × 4 rows = 12
  return 8 // mobile: 2 cols × 4 rows = 8
}

export function useCategoryProducts(config: CategoryConfig) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // 🎯 REF PARA SCROLL TO TOP
  const resultsRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<Filters>({
    brands: [],
    categories: [],
    series: [],
    priceRange: { min: 0, max: 1000 },
    heightRange: { min: 0, max: 50 },
    scales: [],
    lines: [], // ✅ NUEVO: Filtro de líneas
    hasReleaseDate: null,
  })

  // 🎯 ACTUALIZAR ITEMS POR PÁGINA EN RESIZE
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(getItemsPerPage())
    }

    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)
    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

  // 🎯 RESETEAR PÁGINA CUANDO CAMBIAN FILTROS
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortBy])

  useEffect(() => {
    const controller = new AbortController()

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/categories/${config.slug}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Category request failed: ${response.status}`)

        const payload = await response.json()
        const foundProducts: Product[] = payload.products.map((product: any) => ({
          ...product,
          createdAt: product.createdAt ? new Date(product.createdAt) : null,
          releaseDate: product.releaseDate ? new Date(product.releaseDate) : null,
          lastViewedAt: product.lastViewedAt ? new Date(product.lastViewedAt) : null,
        }))

        setProducts(foundProducts)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error(`❌ Error cargando productos ${config.name}:`, error)
        setProducts([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [config])

  // Obtener opciones únicas para filtros - MÁS ESTRICTO
  const filterOptions = useMemo(() => {
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort()

    const excludedCategories = ["figura", "figuras", "figure"]
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]
      .filter((category) => category && !excludedCategories.includes(category.toLowerCase()))
      .sort()

    const scales = [...new Set(products.map((p) => p.scale).filter(Boolean))].sort()

    // ✅ AGREGAR LÍNEAS PARA CATEGORÍAS ESPECÍFICAS
    const lines = [...new Set(products.map((p) => p.line).filter(Boolean))].sort()

    // 🎯 SERIES MÁS ESTRICTAS - Solo las que realmente aparecen en los productos
    const availableSeries = config.seriesList.filter((series) =>
      products.some((product) => {
        const productName = product.name.toLowerCase()
        const seriesLower = series.toLowerCase()

        // ✅ VERIFICACIÓN ESTRICTA DE SERIES
        return (
          productName.includes(seriesLower) ||
          (product.description && product.description.toLowerCase().includes(seriesLower))
        )
      }),
    )

    const prices = products.map((p) => p.price).filter(Boolean)
    return {
      brands,
      categories,
      scales,
      lines, // ✅ NUEVO: Líneas disponibles
      series: availableSeries,
      priceRange: {
        min: Math.min(...prices, 0),
        max: Math.max(...prices, 1000),
      },
    }
  }, [products, config.seriesList])

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand || "")) {
        return false
      }

      if (filters.categories.length > 0 && !filters.categories.includes(product.category || "")) {
        return false
      }

      if (filters.series.length > 0) {
        const matchesSeries = filters.series.some((series) => {
          const productName = product.name.toLowerCase()
          const seriesLower = series.toLowerCase()

          // ✅ VERIFICACIÓN ESTRICTA DE SERIES EN FILTROS
          return (
            productName.includes(seriesLower) ||
            (product.description && product.description.toLowerCase().includes(seriesLower))
          )
        })

        if (!matchesSeries) return false
      }

      if (filters.scales.length > 0 && !filters.scales.includes(product.scale || "")) {
        return false
      }

      // ✅ NUEVO: Filtro por líneas
      if (filters.lines.length > 0 && !filters.lines.includes(product.line || "")) {
        return false
      }

      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false
      }

      if (
        product.heightCm &&
        (product.heightCm < filters.heightRange.min || product.heightCm > filters.heightRange.max)
      ) {
        return false
      }

      if (filters.hasReleaseDate !== null) {
        if (filters.hasReleaseDate === true) {
          if (!product.releaseDate) return false

          const releaseDate = product.releaseDate
          const now = new Date()
          const isFuture =
            releaseDate.getFullYear() > now.getFullYear() ||
            (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() > now.getMonth())

          if (!isFuture) return false
        } else {
          if (product.releaseDate) {
            const releaseDate = product.releaseDate
            const now = new Date()
            const isCurrentOrPast =
              releaseDate.getFullYear() < now.getFullYear() ||
              (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() <= now.getMonth())

            if (!isCurrentOrPast) return false
          }
        }
      }

      return true
    })
  }, [products, filters])

  // Ordenar productos
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        case "oldest":
          return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        default:
          return 0
      }
    })
  }, [filteredProducts, sortBy])

  // 🎯 PAGINACIÓN
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedProducts.slice(startIndex, endIndex)
  }, [sortedProducts, currentPage, itemsPerPage])

  const paginationInfo = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, sortedProducts.length)

    return {
      startIndex: startIndex + 1,
      endIndex,
      totalItems: sortedProducts.length,
      currentPage,
      totalPages,
    }
  }, [currentPage, itemsPerPage, sortedProducts.length, totalPages])

  // 🚀 MANEJAR CAMBIO DE PÁGINA CON SCROLL TO TOP
  const handlePageChange = (newPage: number) => {
    // 🎯 SCROLL TO TOP SUAVE
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    } else {
      // Fallback: scroll to top of window
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }

    setCurrentPage(newPage)
  }

  const handleFilterChange = (filterType: keyof Filters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      brands: [],
      categories: [],
      series: [],
      priceRange: { min: 0, max: 1000 },
      heightRange: { min: 0, max: 50 },
      scales: [],
      lines: [], // ✅ NUEVO: Limpiar líneas
      hasReleaseDate: null,
    })
  }

  const activeFiltersCount =
    filters.brands.length +
    filters.categories.length +
    filters.series.length +
    filters.scales.length +
    filters.lines.length + // ✅ NUEVO: Contar filtros de líneas
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
    filteredProducts,
    sortedProducts,
    // 🎯 PROPIEDADES DE PAGINACIÓN
    paginatedProducts,
    currentPage,
    setCurrentPage: handlePageChange, // 🎯 USAR LA FUNCIÓN CON SCROLL
    totalPages,
    itemsPerPage,
    paginationInfo,
    resultsRef, // 🎯 EXPORTAR REF PARA EL COMPONENTE
  }
}
