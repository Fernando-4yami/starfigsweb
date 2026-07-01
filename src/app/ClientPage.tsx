"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { Product } from "@/lib/firebase/products"
import { getCurrentMonthDateRange, getMonthName } from "@/lib/utils"
import ProductCard from "@/components/ProductCard"
import RankingSection from "@/components/sections/ranking-section"
import HowItWorks from "@/components/HowItWorks"
import FacebookReviews from "@/components/FacebookReviews"
import HobbySearchBanner from "@/components/HobbySearchBanner"

const SectionSkeleton = ({ title, itemCount = 6 }: { title: string; itemCount?: number }) => {
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 aspect-square mb-3"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-4 mb-2"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-3 w-3/4"></div>
        </div>
      )),
    [itemCount],
  )

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">{title}</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto "></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-6">{skeletonItems}</div>
    </section>
  )
}

const ProductSectionWithLoadMore = ({
  title,
  products,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadMoreLabel = "Ver más productos",
  loadingLabel = "Cargando productos...",
  emptyMessage = "No hay productos disponibles",
}: {
  title: string
  products: Product[]
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  loadMoreLabel?: string
  loadingLabel?: string
  emptyMessage?: string
}) => {
  const productCards = useMemo(
    () => products.map((product, i) => (
      <ProductCard key={product.id} product={product} priority={i < 2} />
    )),
    [products],
  )

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">{title}</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto "></div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {productCards}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? loadingLabel : loadMoreLabel}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

interface HomePageData {
  weeklyPopular: Product[]
  newlyAdded: Product[]
  currReleases: Product[]
  currentMonthIndex: number
  currentMonthKey: string
  loading: boolean
  error: Error | null
}

interface CatalogCursor {
  date: string
  id: string
}

interface PaginationState {
  cursor: CatalogCursor | null
  hasMore: boolean
  isLoading: boolean
}

const EMPTY_PAGINATION: PaginationState = {
  cursor: null,
  hasMore: false,
  isLoading: false,
}

function parseProducts(products: unknown): Product[] {
  if (!Array.isArray(products)) return []

  return products.map((product: any) => ({
    ...product,
    createdAt: product.createdAt ? new Date(product.createdAt) : null,
    releaseDate: product.releaseDate ? new Date(product.releaseDate) : null,
  }))
}

export default function HomePage({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [data, setData] = useState<HomePageData>(() => {
    const currentMonth = getCurrentMonthDateRange()

    return {
      weeklyPopular: [],
      newlyAdded: initialProducts,
      currReleases: [],
      currentMonthIndex: currentMonth.monthIndex,
      currentMonthKey: `${currentMonth.year}-${String(currentMonth.monthIndex + 1).padStart(2, "0")}`,
      loading: initialProducts.length === 0,
      error: null,
    }
  })
  const [catalogPagination, setCatalogPagination] =
    useState<PaginationState>(EMPTY_PAGINATION)
  const [releasePagination, setReleasePagination] =
    useState<PaginationState>(EMPTY_PAGINATION)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/home")
      if (!response.ok) throw new Error(`Homepage request failed: ${response.status}`)
      const payload = await response.json()

      setData((previous) => ({
        ...previous,
        newlyAdded:
          Array.isArray(payload.newlyAdded) && payload.newlyAdded.length > 0
            ? parseProducts(payload.newlyAdded)
            : previous.newlyAdded,
        weeklyPopular: parseProducts(payload.weeklyPopular),
        currReleases: parseProducts(payload.currReleases),
        currentMonthIndex: Number.isInteger(payload.currentMonthIndex)
          ? payload.currentMonthIndex
          : previous.currentMonthIndex,
        currentMonthKey:
          typeof payload.currentMonthKey === "string"
            ? payload.currentMonthKey
            : previous.currentMonthKey,
        loading: false,
        error: null,
      }))
      setCatalogPagination({
        cursor: payload.newlyAddedCursor || null,
        hasMore: Boolean(payload.newlyAddedHasMore),
        isLoading: false,
      })
      setReleasePagination({
        cursor: payload.currentReleasesCursor || null,
        hasMore: Boolean(payload.currentReleasesHaveMore),
        isLoading: false,
      })
    } catch (err: any) {
      console.error("Error loading homepage data:", err)
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }))
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const loadMoreProducts = useCallback(async () => {
    const cursor = catalogPagination.cursor
    if (!cursor || !catalogPagination.hasMore || catalogPagination.isLoading) return

    setCatalogPagination((previous) => ({ ...previous, isLoading: true }))

    try {
      const params = new URLSearchParams({
        limit: "18",
        cursorDate: cursor.date,
        cursorId: cursor.id,
      })
      const response = await fetch(`/api/catalog?${params.toString()}`)
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)

      const payload = await response.json()
      const nextProducts = parseProducts(payload.products)

      setData((previous) => {
        const knownIds = new Set(previous.newlyAdded.map((product) => product.id))
        const uniqueProducts = nextProducts.filter((product) => !knownIds.has(product.id))

        return {
          ...previous,
          newlyAdded: [...previous.newlyAdded, ...uniqueProducts],
        }
      })
      setCatalogPagination({
        cursor: payload.nextCursor || null,
        hasMore: Boolean(payload.hasMore),
        isLoading: false,
      })
    } catch (error) {
      console.error("Error loading more products:", error)
      setCatalogPagination((previous) => ({ ...previous, isLoading: false }))
    }
  }, [catalogPagination])

  const loadMoreReleases = useCallback(async () => {
    const cursor = releasePagination.cursor
    if (!cursor || !releasePagination.hasMore || releasePagination.isLoading) return

    setReleasePagination((previous) => ({ ...previous, isLoading: true }))

    try {
      const params = new URLSearchParams({
        mode: "releases",
        month: data.currentMonthKey,
        limit: "18",
        cursorDate: cursor.date,
        cursorId: cursor.id,
      })
      const response = await fetch(`/api/catalog?${params.toString()}`)
      if (!response.ok) throw new Error(`Release request failed: ${response.status}`)

      const payload = await response.json()
      const nextProducts = parseProducts(payload.products)

      setData((previous) => {
        const knownIds = new Set(previous.currReleases.map((product) => product.id))
        const uniqueProducts = nextProducts.filter((product) => !knownIds.has(product.id))

        return {
          ...previous,
          currReleases: [...previous.currReleases, ...uniqueProducts],
        }
      })
      setReleasePagination({
        cursor: payload.nextCursor || null,
        hasMore: Boolean(payload.hasMore),
        isLoading: false,
      })
    } catch (error) {
      console.error("Error loading more releases:", error)
      setReleasePagination((previous) => ({ ...previous, isLoading: false }))
    }
  }, [data.currentMonthKey, releasePagination])

  const ctaSection = useMemo(
    () => (
      <section className="border-y border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Contáctanos y te ayudamos a encontrar la figura perfecta para tu colección
          </p>
          <div className="flex justify-center">
            <a
              href="https://api.whatsapp.com/send/?phone=51926951167&text=Hola!%20%C2%BFPrecio%20y%20disponibilidad%20de%20esto%3F%0A%0AAdjunto%20imagen%20si%20tengo%20%F0%9F%91%8D&type=phone_number&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 bg-emerald-500 dark:bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:shadow-lg transition-all duration-300"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    ),
    [],
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HobbySearchBanner />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {data.loading ? (
          <SectionSkeleton title="Nuevos Lanzamientos" itemCount={18} />
        ) : (
          <ProductSectionWithLoadMore
            title="Nuevos Lanzamientos"
            products={data.newlyAdded}
            hasMore={catalogPagination.hasMore}
            isLoadingMore={catalogPagination.isLoading}
            onLoadMore={loadMoreProducts}
            emptyMessage="Próximamente tendremos nuevos productos emocionantes"
          />
        )}

        {data.loading ? (
          <SectionSkeleton title="Ranking Semanal" itemCount={10} />
        ) : (
          <RankingSection products={data.weeklyPopular} />
        )}

        {data.loading ? (
          <SectionSkeleton title={`Lanzamientos de ${getMonthName(data.currentMonthIndex)}`} />
        ) : (
          <ProductSectionWithLoadMore
            title={`Lanzamientos de ${getMonthName(data.currentMonthIndex)}`}
            products={data.currReleases}
            hasMore={releasePagination.hasMore}
            isLoadingMore={releasePagination.isLoading}
            onLoadMore={loadMoreReleases}
            loadMoreLabel="Ver más lanzamientos"
            loadingLabel="Cargando lanzamientos..."
            emptyMessage={`No hay lanzamientos programados para ${getMonthName(data.currentMonthIndex)}`}
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <HowItWorks />
      </div>

      <FacebookReviews />

      {ctaSection}
    </main>
  )
}
