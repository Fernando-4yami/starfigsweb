"use client"

import { getProductBySlug, incrementProductViews } from "@/lib/firebase/products"
import { trackProductView, trackWhatsAppClick } from "@/lib/analytics"
import { notFound, useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { parseSerializedDate, serializeProduct, type SerializedProduct } from "@/lib/serialize-product"

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

interface ProductPageClientProps {
  params: { slug: string }
  initialProduct?: SerializedProduct
}

function CriticalProductImage({
  src,
  alt,
  onLoad,
}: {
  src: string
  alt: string
  onLoad?: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

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
        className={`object-contain transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        sizes="(max-width: 768px) 100vw, 50vw"
        onLoad={handleLoad}
        onError={handleError}
        quality={90}
      />

      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
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

export default function ProductPageClient({ params, initialProduct }: ProductPageClientProps) {
  const router = useRouter()
  const [product, setProduct] = useState<SerializedProduct | null>(initialProduct || null)
  const [loading, setLoading] = useState(!initialProduct)
  const [criticalImageLoaded, setCriticalImageLoaded] = useState(false)

  useEffect(() => {
    if (initialProduct) {
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      try {
        const fetchedProduct = await getProductBySlug(params.slug)
        if (!fetchedProduct) {
          notFound()
          return
        }

        const serializedProduct = serializeProduct(fetchedProduct)
        setProduct(serializedProduct)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch product:", error)
        notFound()
      }
    }

    fetchProduct()
  }, [params.slug, initialProduct])

  useEffect(() => {
    if (!product) return
    const timer = setTimeout(() => {
      Promise.all([
        incrementProductViews(product.id),
        trackProductView(product.id, product.name, product.category || "figura", product.price),
      ]).catch(console.error)
    }, 100)
    return () => clearTimeout(timer)
  }, [product])

  const handleWhatsAppClick = useCallback(() => {
    if (product) {
      trackWhatsAppClick(product.name, product.id)
    }
  }, [product])

  const productData = useMemo(() => {
    if (!product) return null

    const now = new Date()
    const releaseDate = parseSerializedDate(product.releaseDate)

    const showReleaseTag =
      !!releaseDate &&
      (releaseDate.getFullYear() > now.getFullYear() ||
        (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() > now.getMonth()))

    const releaseMonthYear =
      showReleaseTag && releaseDate
        ? format(releaseDate, "MMMM yyyy", { locale: es }).replace(/^./, (str) => str.toUpperCase())
        : ""

    const productUrl = `https://starfigsperu.com/products/${product.slug}`
    const whatsappMessage = ` *${product.name}*.\n${productUrl}`
    const whatsappUrl = `https://wa.me/51926951167?text=${encodeURIComponent(whatsappMessage)}`

    return { releaseDate, showReleaseTag, releaseMonthYear, productUrl, whatsappUrl }
  }, [product])

  if (loading || !product || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

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
                alt={`${product.name} imagen principal`}
                onLoad={() => setCriticalImageLoaded(true)}
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

          <InfiniteRelatedProducts currentProduct={product} initialBatchSize={8} loadMoreBatchSize={8} />
        </div>
      </div>
    </div>
  )
}