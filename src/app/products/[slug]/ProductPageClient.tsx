"use client"

import { trackProductView, trackWhatsAppClick } from "@/lib/analytics"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import { parseSerializedDate, type SerializedProduct } from "@/lib/serialize-product"

import ProductBreadcrumbs from "@/components/product/product-breadcrumbs"
import ProductInfo from "@/components/product/product-info"
import ProductSpecs from "@/components/product/product-specs"
import ProductActions from "@/components/product/product-actions"
import ShareButtons from "@/components/product/share-buttons"
import ProgressiveGallery from "@/components/gallery/progressive-gallery"
import { ArrowLeft } from "lucide-react"
import PromotionBanner from "@/components/product/promotion-banner"
import dynamic from "next/dynamic"

const InfiniteRelatedProducts = dynamic(
  () => import("@/components/product/infinite-related-products"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square mb-3" />
              <div className="bg-gray-200 dark:bg-gray-700 h-4 mb-2" />
              <div className="bg-gray-200 dark:bg-gray-700 h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
)

const FIRESTORE_VIEW_TRACKING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PRODUCT_VIEW_TRACKING === "true"
const VIEW_SAMPLE_RATE = Math.min(
  Math.max(Number(process.env.NEXT_PUBLIC_PRODUCT_VIEW_SAMPLE_RATE || "0.1"), 0),
  1,
)
const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000

interface ProductPageClientProps {
  params: { slug: string }
  initialProduct: SerializedProduct
}

function CriticalProductImage({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  const [imageError, setImageError] = useState(false)

  const handleError = () => {
    setImageError(true)
  }

  if (imageError) {
    return (
      <div className="w-full h-96 md:h-[500px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-600">Imagen no disponible</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 md:h-[500px] bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        priority={true}
        className="object-contain"
        sizes="(max-width: 767px) 300px, (max-width: 1279px) 45vw, 592px"
        onError={handleError}
        quality={70}
      />
    </div>
  )
}

function DeferredRelatedProducts({ product }: { product: SerializedProduct }) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "400px 0px" },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionRef} className="min-h-[320px]">
      {isVisible ? (
        <InfiniteRelatedProducts currentProduct={product} initialBatchSize={8} loadMoreBatchSize={8} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square mb-3" />
              <div className="bg-gray-200 dark:bg-gray-700 h-4 mb-2" />
              <div className="bg-gray-200 dark:bg-gray-700 h-3 w-3/4" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormattedDescription({ text }: { text: string }) {
  // Convertir texto entre comillas dobles a negrita
  const parts = text.split(/"/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-blue-700 dark:text-blue-300">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function ProductPageClient({ initialProduct: product }: ProductPageClientProps) {
  const router = useRouter()

  useEffect(() => {
    let idleId: number | undefined
    let timerId: ReturnType<typeof setTimeout> | undefined

    const recordView = () => {
      if (navigator.webdriver) return

      trackProductView(product.id, product.name, product.category || "figura", product.price)

      if (!FIRESTORE_VIEW_TRACKING_ENABLED) return
      if (Math.random() > VIEW_SAMPLE_RATE) return

      const sessionKey = `starfigs:viewed:${product.id}`
      const now = Date.now()

      try {
        const previousView = Number(localStorage.getItem(sessionKey) || "0")
        if (previousView && now - previousView < VIEW_COOLDOWN_MS) return
        localStorage.setItem(sessionKey, String(now))
      } catch {
        // Storage can be unavailable in strict privacy modes.
      }

      fetch(`/api/products/${encodeURIComponent(product.id)}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(console.error)
    }

    const scheduleView = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(recordView, { timeout: 4000 })
      } else {
        timerId = setTimeout(recordView, 2000)
      }
    }

    if (document.readyState === "complete") {
      scheduleView()
    } else {
      window.addEventListener("load", scheduleView, { once: true })
    }

    return () => {
      window.removeEventListener("load", scheduleView)
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timerId !== undefined) {
        clearTimeout(timerId)
      }
    }
  }, [product.id, product.name, product.category, product.price])

  const handleWhatsAppClick = useCallback(() => {
    if (product) {
      trackWhatsAppClick(product.name, product.id)
    }
  }, [product])

  const productData = useMemo(() => {
    const now = new Date()
    const releaseDate = parseSerializedDate(product.releaseDate)

    const showReleaseTag =
      !!releaseDate &&
      (releaseDate.getFullYear() > now.getFullYear() ||
        (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() > now.getMonth()))

    const releaseMonthYear =
      showReleaseTag && releaseDate
        ? new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" })
            .format(releaseDate)
            .replace(/^./, (str) => str.toUpperCase())
        : ""

    const productUrl = `https://starfigsperu.com/products/${product.slug}`
    const whatsappMessage = ` *${product.name}*.\n${productUrl}`
    const whatsappUrl = `https://wa.me/51926951167?text=${encodeURIComponent(whatsappMessage)}`

    return { releaseDate, showReleaseTag, releaseMonthYear, productUrl, whatsappUrl }
  }, [product])

  const mainImageUrl = product.imageUrls?.[0] || "/placeholder.svg"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Botón Volver - línea separada del breadcrumb */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit py-1"
            title="Volver a la página anterior"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <ProductBreadcrumbs category={product.category || "figura"} productName={product.name} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            {product.imageUrls?.length > 1 ? (
              <ProgressiveGallery
                imageUrls={product.imageUrls}
                galleryThumbnailUrls={product.galleryThumbnailUrls}
                productName={product.name}
                priority={true}
              />
            ) : (
              <CriticalProductImage
                src={mainImageUrl}
                alt={`${product.name} - Figura de anime coleccionable - Foto principal`}
              />
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center px-2 py-1 bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-700">
              <span className="opacity-75">
                Las imágenes mostradas son de carácter referencial y pueden no corresponder exactamente al producto final.
              </span>
            </div>

            <ShareButtons productUrl={productData.productUrl} productName={product.name} />
          </div>

          <div className="space-y-6">
            <ProductInfo
              name={product.name}
              price={product.price}
              category={product.category || "figura"}
              releaseDate={product.releaseDate}
              showReleaseTag={productData.showReleaseTag}
              releaseMonthYear={productData.releaseMonthYear}
              stock={product.stock}
              lowStockThreshold={product.lowStockThreshold}
              discount={product.discount}
            />

            <PromotionBanner />

            <ProductSpecs
              brand={product.brand}
              line={product.line}
              heightCm={product.heightCm}
              scale={product.scale}
              gtin={product.gtin}
            />

            {product.description_es && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400">Descripción</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  <FormattedDescription text={product.description_es} />
                </p>
              </div>
            )}

            <ProductActions
              whatsappUrl={productData.whatsappUrl}
              onWhatsAppClick={handleWhatsAppClick}
              releaseDate={product.releaseDate}
              price={product.price}
            />
          </div>
        </div>

        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-2">Productos relacionados</h2>
          </div>

          <DeferredRelatedProducts product={product} />
        </div>
      </div>
    </div>
  )
}
