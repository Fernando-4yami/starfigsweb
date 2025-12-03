"use client"

import { ChevronRight, Home, Package, Calendar, Filter, X } from 'lucide-react'
import Link from "next/link"
import ProductCard from "@/components/ProductCard"
import DynamicIcon from "@/components/dynamic-icon"
import { Pagination } from "@/components/ui/pagination"
import { useCategoryProducts } from "@/hooks/use-category-products"
import type { CategoryConfig } from "@/types/category"

interface CategoryPageProps {
  config: CategoryConfig
}

export default function CategoryPage({ config }: CategoryPageProps) {
  const {
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
    paginatedProducts,
    currentPage,
    setCurrentPage,
    totalPages,
    paginationInfo,
    resultsRef,
  } = useCategoryProducts(config)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="flex gap-8">
              <div className="w-64 space-y-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg mb-3"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${config.colors.gradient} dark:bg-gray-900`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <Link href="/" className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400 dark:text-gray-500">Categorías</span>
          <ChevronRight className="w-4 h-4" />
          <span className={`${config.colors.primary} dark:text-blue-400 font-medium`}>{config.name}</span>
        </nav>

        <div ref={resultsRef} />

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-64 space-y-6">
            <FiltersContent
              config={config}
              filterOptions={filterOptions}
              filters={filters}
              handleFilterChange={handleFilterChange}
              clearAllFilters={clearAllFilters}
              activeFiltersCount={activeFiltersCount}
              products={products}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md/5 border border-gray-200 dark:border-gray-700">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 
                            p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md/5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
                >
                  <Filter className="w-4 h-4" />
                  Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Package className="w-5 h-5" />
                  <span className="font-semibold">
                    {paginationInfo.startIndex}-{paginationInfo.endIndex} de {paginationInfo.totalItems} productos
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ordenar:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
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
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md/5 border border-gray-200 dark:border-gray-700">
                <DynamicIcon name={config.iconName} className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No se encontraron productos {config.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Intenta ajustar los filtros para ver más resultados</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg 
                           hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="mt-8 mb-8"
                />
              </>
            )}
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filtros</h3>
                <button 
                  onClick={() => setShowMobileFilters(false)} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
              <div className="p-4">
                <FiltersContent
                  config={config}
                  filterOptions={filterOptions}
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  clearAllFilters={clearAllFilters}
                  activeFiltersCount={activeFiltersCount}
                  products={products}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Agregar esto al final del archivo category-page.tsx

interface FiltersContentProps {
  config: any
  filterOptions: any
  filters: any
  handleFilterChange: (key: string, value: any) => void
  clearAllFilters: () => void
  activeFiltersCount: number
  products: any[]
}

function FiltersContent({
  config,
  filterOptions,
  filters,
  handleFilterChange,
  clearAllFilters,
  activeFiltersCount,
  products,
}: FiltersContentProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md/5 border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filtros</h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Limpiar ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Series */}
      {filterOptions.series.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Series</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filterOptions.series.map((series: string) => (
              <label key={series} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.series.includes(series)}
                  onChange={(e) => {
                    const newSeries = e.target.checked
                      ? [...filters.series, series]
                      : filters.series.filter((s: string) => s !== series)
                    handleFilterChange("series", newSeries)
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {series} ({products.filter((p) => p.name.toLowerCase().includes(series.toLowerCase())).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Marcas */}
      {filterOptions.brands.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Fabricante</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.brands.map((brand: string) => (
              <label key={brand} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={brand ? filters.brands.includes(brand) : false}
                  onChange={(e) => {
                    const newBrands = e.target.checked
                      ? [...filters.brands, brand]
                      : filters.brands.filter((b: string) => b !== brand)
                    handleFilterChange("brands", newBrands)
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {brand} ({products.filter((p) => p.brand === brand).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Categorías */}
      {filterOptions.categories.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Categoría</h4>
          <div className="space-y-2">
            {filterOptions.categories.map((category: string) => (
              <label key={category} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={category ? filters.categories.includes(category) : false}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...filters.categories, category]
                      : filters.categories.filter((c: string) => c !== category)
                    handleFilterChange("categories", newCategories)
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {category} ({products.filter((p) => p.category === category).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Precio */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Precio</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  min: Number(e.target.value) || 0,
                })
              }
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <span className="text-gray-500 dark:text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  max: Number(e.target.value) || 1000,
                })
              }
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            S/. {filterOptions.priceRange.min} - S/. {filterOptions.priceRange.max}
          </div>
        </div>
      </div>

      {/* Escalas */}
      {filterOptions.scales.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Escala</h4>
          <div className="space-y-2">
            {filterOptions.scales.map((scale: string) => (
              <label key={scale} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scale ? filters.scales.includes(scale) : false}
                  onChange={(e) => {
                    const newScales = e.target.checked
                      ? [...filters.scales, scale]
                      : filters.scales.filter((s: string) => s !== scale)
                    handleFilterChange("scales", newScales)
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {scale} ({products.filter((p) => p.scale === scale).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Líneas */}
      {(config.name === "Figuras Escala" || config.name === "Figuras de Premio") &&
        filterOptions.lines.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Líneas</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filterOptions.lines.map((line: string) => (
                <label key={line} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={line ? filters.lines.includes(line) : false}
                    onChange={(e) => {
                      const newLines = e.target.checked
                        ? [...filters.lines, line]
                        : filters.lines.filter((l: string) => l !== line)
                      handleFilterChange("lines", newLines)
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {line} ({products.filter((p) => p.line === line).length})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

      {/* Disponibilidad */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Disponibilidad</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="releaseDate"
              checked={filters.hasReleaseDate === null}
              onChange={() => handleFilterChange("hasReleaseDate", null)}
              className="text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Todos</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="releaseDate"
              checked={filters.hasReleaseDate === true}
              onChange={() => handleFilterChange("hasReleaseDate", true)}
              className="text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Pre-venta</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="releaseDate"
              checked={filters.hasReleaseDate === false}
              onChange={() => handleFilterChange("hasReleaseDate", false)}
              className="text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Lanzamientos pasados</span>
          </label>
        </div>
      </div>
    </div>
  )
}