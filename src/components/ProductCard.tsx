"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { incrementProductViews, type Product } from "@/lib/firebase/products"

interface ProductCardProps {
  product: Product
}

// 🔧 FUNCIÓN HELPER PARA PARSEAR FECHA SEGURA (como fallback)
const parseReleaseDate = (releaseDate: any): Date | null => {
  if (!releaseDate) return null

  // Si ya es un objeto Date (caso normal después de normalización)
  if (releaseDate instanceof Date) {
    return releaseDate
  }

  // Si es Timestamp de Firestore (fallback)
  if (releaseDate.toDate && typeof releaseDate.toDate === "function") {
    return releaseDate.toDate()
  }

  // Si es objeto con seconds (serializado - fallback)
  if (releaseDate.seconds) {
    return new Date(releaseDate.seconds * 1000)
  }

  // Si es string o number (fallback)
  if (typeof releaseDate === "string" || typeof releaseDate === "number") {
    return new Date(releaseDate)
  }

  console.warn("Formato de fecha no reconocido:", releaseDate)
  return null
}

export default function ProductCard({ product }: ProductCardProps) {
  const now = new Date()

  // 🔧 USAR FUNCIÓN HELPER PARA PARSEAR FECHA (principalmente como fallback)
  const releaseDate = parseReleaseDate(product.releaseDate)

  const isCurrentMonth =
    !!releaseDate && releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() === now.getMonth()

  const isFutureRelease =
    !!releaseDate &&
    (releaseDate.getFullYear() > now.getFullYear() ||
      (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() > now.getMonth()))

  const showReleaseTag = !!releaseDate && (isCurrentMonth || isFutureRelease)

  const releaseMonthYear = releaseDate
    ? format(releaseDate, "MMMM yyyy", { locale: es }).replace(/^./, (str) => str.toUpperCase())
    : ""

  const tagColorClass = isCurrentMonth ? "bg-emerald-500" : "bg-amber-600"

  // 🚀 FUNCIÓN MEJORADA PARA INCREMENTAR VISTAS
  const handleClick = async (e: React.MouseEvent) => {
    try {
      console.log(`🔍 Incrementando views para producto: ${product.id} - ${product.name}`)

      // Ejecutar sin await para no bloquear la navegación
      incrementProductViews(product.id)
        .then(() => {
          console.log(`✅ Views incrementadas para: ${product.name}`)
        })
        .catch((error) => {
          console.error(`❌ Error incrementando views para ${product.name}:`, error)
        })
    } catch (error) {
      console.error("Error en handleClick:", error)
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block text-inherit no-underline" onClick={handleClick}>
      <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
        {/* Contenedor cuadrado para imagen */}
        <div className="relative w-full h-0 pb-[100%] bg-gray-50 overflow-hidden">
          {/* Etiqueta de lanzamiento */}
          {showReleaseTag && (
            <span
              className={`absolute bottom-2 left-2 ${tagColorClass} text-white text-xs font-semibold px-2 py-1 rounded shadow-md z-10`}
            >
              {releaseMonthYear}
            </span>
          )}

          {/* 🚀 Usar thumbnailUrl (300px) si existe, sino imageUrl original */}
          <Image
            src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-300 bg-white"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          />
        </div>

        {/* Info del producto */}
        <div className="p-4 flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.heightCm && (
            <span className="text-xs text-gray-500">
              Altura: <strong>{product.heightCm} cm</strong>
            </span>
          )}

          {/* 🔧 SOLO MOSTRAR PRECIO SI ES MAYOR A 0 */}
          {product.price > 0 && (
            <span className="text-orange-600 font-bold text-base">S/. {product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
