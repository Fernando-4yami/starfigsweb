"use client"

import { useState, useEffect, Suspense, useMemo, useCallback } from "react"
import { getNewReleases, getNewReleasesByDateRange, type Product, getPopularProducts } from "@/lib/firebase/products"
import { getCurrentMonthDateRange, getNextMonthStartDate, getMonthName } from "@/lib/utils"
import RankingSection from "@/components/sections/ranking-section"
import ProductCard from "@/components/ProductCard"

const SectionSkeleton = ({ title, itemCount = 6 }: { title: string; itemCount?: number }) => {
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted aspect-square rounded-lg mb-3"></div>
          <div className="bg-muted h-4 rounded mb-2"></div>
          <div className="bg-muted h-3 rounded w-3/4"></div>
        </div>
      )),
    [itemCount],
  )

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 text-center">{title}</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-6">{skeletonItems}</div>
    </section>
  )
}

const ProductSection = ({
  title,
  products,
  emptyMessage = "No hay productos disponibles",
}: {
  title: string
  products: Product[]
  emptyMessage?: string
}) => {
  const productCards = useMemo(
    () => products.map((product) => <ProductCard key={product.id} product={product} />),
    [products],
  )

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 text-center">{title}</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {productCards}
        </div>
      )}
    </section>
  )
}

const ProductSectionWithLoadMore = ({
  title,
  products,
  initialCount = 18,
  loadMoreCount = 18,
  emptyMessage = "No hay productos disponibles",
}: {
  title: string
  products: Product[]
  initialCount?: number
  loadMoreCount?: number
  emptyMessage?: string
}) => {
  const [visibleCount, setVisibleCount] = useState(initialCount)

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount])

  const hasMore = visibleCount < products.length

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + loadMoreCount, products.length))
  }

  const productCards = useMemo(
    () => visibleProducts.map((product) => <ProductCard key={product.id} product={product} />),
    [visibleProducts],
  )

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 text-center">{title}</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {productCards}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-white border-2 border-purple-300 text-purple-700 font-medium rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors duration-200"
              >
                Ver más productos ({products.length - visibleCount} restantes)
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
  futureReleases: Product[]
  loading: boolean
  error: Error | null
}

export default function HomePage() {
  const [data, setData] = useState<HomePageData>({
    weeklyPopular: [],
    newlyAdded: [],
    currReleases: [],
    futureReleases: [],
    loading: true,
    error: null,
  })

  const dateRanges = useMemo(() => {
    const { start: currStart, end: currEnd } = getCurrentMonthDateRange()
    const nextMonthStart = getNextMonthStartDate()
    return { currStart, currEnd, nextMonthStart }
  }, [])

  const fetchData = useCallback(async () => {
    const { currStart, currEnd, nextMonthStart } = dateRanges

    try {
      const [newlyAddedData, weeklyPopularData, currReleasesData, futureReleasesData] = await Promise.all([
        getNewReleases(60),
        getPopularProducts(10),
        getNewReleasesByDateRange(currStart, currEnd),
        getNewReleasesByDateRange(nextMonthStart, new Date("2100-01-01")),
      ])

      const sortedFuture = futureReleasesData.sort(
        (a, b) => (a.releaseDate?.getTime() || 0) - (b.releaseDate?.getTime() || 0),
      )

      setData({
        newlyAdded: newlyAddedData,
        weeklyPopular: weeklyPopularData,
        currReleases: currReleasesData,
        futureReleases: sortedFuture,
        loading: false,
        error: null,
      })
    } catch (err: any) {
      console.error("Error loading homepage data:", err)
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }))
    }
  }, [dateRanges])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const ctaSection = useMemo(
    () => (
      <section className="relative py-20 mt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white to-gray-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 backdrop-blur-sm"></div>
        <div className="relative max-w-4xl mx-auto text-center px-6">
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
              className="inline-flex items-center px-8 py-3 bg-emerald-500 text-white font-semibold rounded-full shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all duration-300"
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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {data.loading ? (
          <SectionSkeleton title="Nuevos Lanzamientos" itemCount={18} />
        ) : (
          <ProductSectionWithLoadMore
            title="Nuevos Lanzamientos"
            products={data.newlyAdded}
            initialCount={18}
            loadMoreCount={18}
            emptyMessage="Próximamente tendremos nuevos productos emocionantes"
          />
        )}

        {data.loading ? (
          <SectionSkeleton title="Ranking Semanal" itemCount={10} />
        ) : (
          <RankingSection products={data.weeklyPopular} />
        )}

        {data.loading ? (
          <SectionSkeleton title={`Lanzamientos de ${getMonthName(dateRanges.currStart.getMonth())}`} />
        ) : (
          <ProductSection
            title={`Lanzamientos de ${getMonthName(dateRanges.currStart.getMonth())}`}
            products={data.currReleases}
            emptyMessage={`No hay lanzamientos programados para ${getMonthName(dateRanges.currStart.getMonth())}`}
          />
        )}

        {data.loading ? (
          <SectionSkeleton title="Próximos Lanzamientos" />
        ) : (
          <ProductSection
            title="Próximos Lanzamientos"
            products={data.futureReleases.slice(0, 12)}
            emptyMessage="No hay lanzamientos futuros programados"
          />
        )}
      </div>

      {/* CTA Section */}
      {ctaSection}
    </main>
  )
}