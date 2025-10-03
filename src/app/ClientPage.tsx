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
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-center">{title}</h2>
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
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-center">{title}</h2>
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
      const newlyAddedData = await getNewReleases(12)

      setData((prev) => ({
        ...prev,
        newlyAdded: newlyAddedData,
        loading: false,
      }))

      const [weeklyPopularData, currReleasesData, futureReleasesData] = await Promise.all([
        getPopularProducts(10),
        getNewReleasesByDateRange(currStart, currEnd),
        getNewReleasesByDateRange(nextMonthStart, new Date("2100-01-01")),
      ])

      const sortedFuture = futureReleasesData.sort(
        (a, b) => (a.releaseDate?.getTime() || 0) - (b.releaseDate?.getTime() || 0),
      )

      setData((prev) => ({
        ...prev,
        weeklyPopular: weeklyPopularData,
        currReleases: currReleasesData,
        futureReleases: sortedFuture,
        error: null,
      }))
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
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
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
        {data.loading && data.newlyAdded.length === 0 ? (
          <SectionSkeleton title="Nuevos Lanzamientos" itemCount={12} />
        ) : (
          <ProductSection
            title="Nuevos Lanzamientos"
            products={data.newlyAdded.slice(0, 12)}
            emptyMessage="Próximamente tendremos nuevos productos emocionantes"
          />
        )}

        {data.weeklyPopular.length > 0 ? (
          <Suspense fallback={<SectionSkeleton title="Ranking Semanal" itemCount={10} />}>
            <RankingSection products={data.weeklyPopular} />
          </Suspense>
        ) : (
          !data.loading && <SectionSkeleton title="Ranking Semanal" itemCount={10} />
        )}

        {data.currReleases.length > 0 && (
          <Suspense
            fallback={<SectionSkeleton title={`Lanzamientos de ${getMonthName(dateRanges.currStart.getMonth())}`} />}
          >
            <ProductSection
              title={`Lanzamientos de ${getMonthName(dateRanges.currStart.getMonth())}`}
              products={data.currReleases}
              emptyMessage={`No hay lanzamientos programados para ${getMonthName(dateRanges.currStart.getMonth())}`}
            />
          </Suspense>
        )}

        {data.futureReleases.length > 0 && (
          <Suspense fallback={<SectionSkeleton title="Próximos Lanzamientos" />}>
            <ProductSection
              title="Próximos Lanzamientos"
              products={data.futureReleases.slice(0, 12)}
              emptyMessage="No hay lanzamientos futuros programados"
            />
          </Suspense>
        )}
      </div>

      {/* CTA Section */}
      {ctaSection}
    </main>
  )
}
