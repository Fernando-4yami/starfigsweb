"use client"

import { useCallback, useEffect, useState } from "react"
import ProductCard from "@/components/ProductCard"
import type { SerializedProduct } from "@/lib/serialize-product"

interface CatalogCursor {
  date: string
  id: string
}

interface CatalogResponse {
  products: SerializedProduct[]
  hasMore: boolean
  nextCursor: CatalogCursor | null
}

export default function CatalogoClient() {
  const [products, setProducts] = useState<SerializedProduct[]>([])
  const [cursor, setCursor] = useState<CatalogCursor | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (pageCursor: CatalogCursor | null, append: boolean) => {
      const params = new URLSearchParams({ limit: "20" })
      if (pageCursor) {
        params.set("cursorDate", pageCursor.date)
        params.set("cursorId", pageCursor.id)
      }

      const response = await fetch(`/api/catalog?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Catalog request failed: ${response.status}`)
      }

      const payload = (await response.json()) as CatalogResponse
      const validProducts = payload.products.filter(
        (product) =>
          product?.id &&
          product?.name &&
          Number.isFinite(Number(product.price)) &&
          (Boolean(product.thumbnailUrl) ||
            (Array.isArray(product.imageUrls) && product.imageUrls.length > 0)),
      )

      setProducts((previous) =>
        append ? [...previous, ...validProducts] : validProducts,
      )
      setCursor(payload.nextCursor)
      setHasMore(payload.hasMore)
      setError(null)
    },
    [],
  )

  useEffect(() => {
    const loadInitialProducts = async () => {
      try {
        await fetchPage(null, false)
      } catch (loadError) {
        console.error("Error loading catalog:", loadError)
        setError(
          loadError instanceof Error ? loadError.message : "Error desconocido",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadInitialProducts()
  }, [fetchPage])

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return

    setLoadingMore(true)
    try {
      await fetchPage(cursor, true)
    } catch (loadError) {
      console.error("Error loading more catalog products:", loadError)
      setError(
        loadError instanceof Error ? loadError.message : "Error desconocido",
      )
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="px-6 py-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Catálogo</h1>

      {loading && <p className="py-12 text-center">Cargando productos...</p>}

      {!loading && products.length === 0 && error && (
        <div className="py-12 text-center">
          <p className="mb-4 text-red-500">
            Error al cargar productos: {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-12 text-center">No hay productos disponibles</p>
      )}

      {products.length > 0 && (
        <>
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>

          {error && (
            <p className="mt-6 text-center text-sm text-red-500">{error}</p>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-2 border-purple-300 bg-white px-8 py-3 font-medium text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-wait disabled:opacity-60 dark:border-purple-700 dark:bg-gray-800 dark:text-purple-300 dark:hover:border-purple-600 dark:hover:bg-gray-700"
              >
                {loadingMore ? "Cargando..." : "Ver más productos"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
