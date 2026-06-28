"use client"

import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Product } from "@/lib/firebase/products"
import {
  type SerializedProduct,
  parseSerializedDate,
  hasActiveDiscount,
  calculateFinalPrice,
  getDiscountPercentage,
  isReleasedOverAMonth,
} from "@/lib/serialize-product"

interface ProductCardProps {
  product: Product | SerializedProduct
  /**
   * Si es true, la imagen se carga con priority (no lazy).
   * Útil para los primeros productos visibles en homepage/categorías (mejora LCP).
   */
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const now = new Date()
  const releaseDate = parseSerializedDate(product.releaseDate)

  const isCurrentMonth =
    !!releaseDate && releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() === now.getMonth()

  const isFutureRelease =
    !!releaseDate &&
    (releaseDate.getFullYear() > now.getFullYear() ||
      (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() > now.getMonth()))

  const showReleaseTag = !!releaseDate && (isCurrentMonth || isFutureRelease)
  const isOldRelease = isReleasedOverAMonth({ releaseDate: product.releaseDate })

  const releaseMonthYear = releaseDate
    ? format(releaseDate, "MMMM yyyy", { locale: es }).replace(/^./, (str) => str.toUpperCase())
    : ""

  const tagColorClass = isCurrentMonth ? "bg-emerald-500" : "bg-amber-600"

  // 🔥 Descuento
  const hasDiscount = hasActiveDiscount(product)
  const finalPrice = calculateFinalPrice(product)
  const discountPercentage = getDiscountPercentage(product)

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch={false}
      className="group block text-inherit no-underline"
    >
      <div className="bg-white dark:bg-gray-800 shadow-md hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-shadow duration-300 overflow-hidden flex flex-col border border-transparent dark:border-gray-700">
        {/* Imagen */}
        <div className="relative w-full h-0 pb-[100%] bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {isOldRelease && (
            <span
              className="absolute top-2 left-2 bg-gray-800/80 dark:bg-gray-900/80 text-white text-xs font-bold px-2 py-1 shadow-md z-10">
              Agotado
            </span>
          )}

          {showReleaseTag && (
            <span
              className={`absolute bottom-2 left-2 ${tagColorClass} text-white text-xs font-semibold px-2 py-1 shadow-md z-10`}
            >
              {releaseMonthYear}
            </span>
          )}

          {hasDiscount && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-md z-10">
              -{discountPercentage}%
            </span>
          )}

          <Image
            src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            priority={priority}
            className="object-contain transition-transform duration-300 bg-white dark:bg-gray-800"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          />
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.heightCm && (
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Altura: <strong>{product.heightCm} cm</strong>
            </span>
          )}

          {product.price > 0 && (
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-gray-500 dark:text-gray-400 line-through text-sm">S/. {product.price.toFixed(2)}</span>
                  <span className="text-red-600 dark:text-red-400 font-bold text-base">S/. {finalPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-orange-600 dark:text-orange-400 font-bold text-base">S/. {product.price.toFixed(2)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
