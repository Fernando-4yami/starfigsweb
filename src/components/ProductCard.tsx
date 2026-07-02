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
              className="absolute left-1.5 top-1.5 z-10 bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md dark:bg-gray-900/80 sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs">
              Agotado
            </span>
          )}

          {showReleaseTag && (
            <span
              className={`absolute bottom-1.5 left-1.5 z-10 ${tagColorClass} px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md sm:bottom-2 sm:left-2 sm:px-2 sm:py-1 sm:text-xs`}
            >
              {releaseMonthYear}
            </span>
          )}

          {hasDiscount && (
            <span className="absolute right-1.5 top-1.5 z-10 bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md sm:right-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs">
              -{discountPercentage}%
            </span>
          )}

          <Image
            src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            priority={priority}
            className="object-contain transition-transform duration-300 bg-white dark:bg-gray-800"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, (max-width: 1536px) 17vw, 210px"
          />
        </div>

        {/* Info */}
        <div className="flex min-h-[82px] flex-col gap-0.5 p-2 sm:min-h-[108px] sm:gap-1 sm:p-4">
          <h3 className="line-clamp-2 break-words text-xs font-semibold text-gray-800 transition-colors group-hover:text-amber-600 dark:text-gray-100 dark:group-hover:text-amber-400 sm:text-sm">
            {product.name}
          </h3>

          {product.heightCm && (
            <span className="text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
              Altura: <strong>{product.heightCm} cm</strong>
            </span>
          )}

          {product.price > 0 && (
            <div className="mt-auto flex flex-col items-start gap-0 sm:flex-row sm:items-center sm:gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-[10px] text-gray-500 line-through dark:text-gray-400 sm:text-sm">S/. {product.price.toFixed(2)}</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 sm:text-base">S/. {finalPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 sm:text-base">S/. {product.price.toFixed(2)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
