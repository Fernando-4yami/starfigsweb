"use client"

import { getProductBySlug, incrementProductViews } from "@/lib/firebase/products"
import { trackProductView, trackWhatsAppClick } from "@/lib/analytics"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { parseSerializedDate, type SerializedProduct } from "@/lib/serialize-product"

// 🎯 Componentes extraídos
import ProductBreadcrumbs from "@/components/product/product-breadcrumbs"
import ProductInfo from "@/components/product/product-info"
import ProductSpecs from "@/components/product/product-specs"
import ProductActions from "@/components/product/product-actions"
import ShareButtons from "@/components/product/share-buttons"
import ProgressiveGallery from "@/components/gallery/progressive-gallery"
import PromotionBanner from "@/components/product/promotion-banner"
import InfiniteRelatedProducts from "@/components/product/infinite-related-products"

interface ProductPageClientProps {
  params: { slug: string }
  initialProduct?: SerializedProduct
}

// 🚀 CRITICAL IMAGE - Componente separado para LCP
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
      <div className="w-full h-96 md:h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-400">Imagen no disponible</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 md:h-[500px] bg-gray-50 rounded-xl overflow-hidden">
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
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default function ProductPageClient({ params, initialProduct }: ProductPageClientProps) {
  const [product, setProduct] = useState<SerializedProduct | null>(initialProduct || null)
  const [loading, setLoading] = useState(!initialProduct)
  const [showFullGallery, setShowFullGallery] = useState(false)
  const [criticalImageLoaded, setCriticalImageLoaded] = useState(false)

  // 🚀 FETCH PRINCIPAL - Solo si no hay initialProduct
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

        // 🔧 SERIALIZAR EL PRODUCTO FETCHED
        const serializedProduct: SerializedProduct = {
          id: fetchedProduct.id,
          name: fetchedProduct.name,
          slug: fetchedProduct.slug,
          price: fetchedProduct.price,
          description: fetchedProduct.description,
          imageUrls: fetchedProduct.imageUrls,
          thumbnailUrl: fetchedProduct.thumbnailUrl,
          galleryThumbnailUrls: fetchedProduct.galleryThumbnailUrls,
          brand: fetchedProduct.brand,
          line: fetchedProduct.line,
          category: fetchedProduct.category,
          heightCm: fetchedProduct.heightCm,
          scale: fetchedProduct.scale,
          views: fetchedProduct.views,
          createdAt: fetchedProduct.createdAt?.toISOString() || null,
          releaseDate: fetchedProduct.releaseDate?.toISOString() || null,
          lastViewedAt: fetchedProduct.lastViewedAt?.toISOString() || null,
        }

        setProduct(serializedProduct)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch product:", error)
        notFound()
      }
    }

    fetchProduct()
  }, [params.slug, initialProduct])

  // 🚀 TRACKING - Solo si tenemos producto
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

  // 🚀 CALLBACKS MEMOIZADOS
  const handleWhatsAppClick = useCallback(() => {
    if (product) {
      trackWhatsAppClick(product.name, product.id)
    }
  }, [product])

  // 🚀 CÁLCULOS MEMOIZADOS
  const productData = useMemo(() => {
    if (!product) return null

    const now = new Date()
    const releaseDate = parseSerializedDate(product.releaseDate)

    const showReleaseTag =
      !!releaseDate &&
      (releaseDate.getFullYear() > now.getFullYear() ||
        (releaseDate.getFullYear() === now.getFullYear() && releaseDate.getMonth() > now.getMonth()))

    // 🔧 SOLO CALCULAR releaseMonthYear SI showReleaseTag ES TRUE
    const releaseMonthYear =
      showReleaseTag && releaseDate
        ? format(releaseDate, "MMMM yyyy", { locale: es }).replace(/^./, (str) => str.toUpperCase())
        : ""

    const productUrl = `https://starfigsperu.com/products/${product.slug}`
    const whatsappMessage = `Hola, estoy interesado en reservar el producto *${product.name}*.\n${productUrl}`
    const whatsappUrl = `https://wa.me/51926951167?text=${encodeURIComponent(whatsappMessage)}`

    return {
      releaseDate,
      showReleaseTag,
      releaseMonthYear,
      productUrl,
      whatsappUrl,
    }
  }, [product])

  if (loading || !product || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const mainImageUrl = product.imageUrls?.[0] || "/placeholder.svg"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Breadcrumbs */}
      <ProductBreadcrumbs category={product.category || "figura"} productName={product.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* 🚀 IMAGEN CRÍTICA */}
        <div className="space-y-4">
          {product.imageUrls?.length > 1 ? (
            <ProgressiveGallery
              imageUrls={product.imageUrls}
              galleryThumbnailUrls={product.galleryThumbnailUrls}
              productName={product.name}
              priority={true} // Para LCP
            />
          ) : (
            <CriticalProductImage
              src={mainImageUrl}
              alt={`${product.name} imagen principal`}
              onLoad={() => setCriticalImageLoaded(true)}
            />
          )}

          {/* Image Disclaimer */}
          <div className="text-xs text-gray-500 italic text-center px-2 py-1 bg-gray-50 rounded border-l-2 border-gray-300">
            <span className="opacity-75">
              Las imágenes mostradas son de carácter referencial y pueden no corresponder exactamente al producto final.
            </span>
          </div>

          {/* Share buttons */}
          <ShareButtons productUrl={productData.productUrl} productName={product.name} />
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <ProductInfo
            name={product.name}
            price={product.price}
            category={product.category || "figura"}
            releaseDate={product.releaseDate} // 🔧 PASAR STRING SERIALIZADO
            showReleaseTag={productData.showReleaseTag}
            releaseMonthYear={productData.releaseMonthYear}
          />

          {/* 🎉 BANNER DE PROMOCIÓN */}
          <PromotionBanner />

          <ProductSpecs brand={product.brand} line={product.line} heightCm={product.heightCm} scale={product.scale} />

          {product.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-blue-800">Descripción</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <ProductActions
            whatsappUrl={productData.whatsappUrl}
            onWhatsAppClick={handleWhatsAppClick}
            releaseDate={product.releaseDate} // 🔧 PASAR STRING SERIALIZADO
          />
        </div>
      </div>

      {/* 🚀 PRODUCTOS RELACIONADOS INFINITOS */}
      <div className="mt-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">
            Productos relacionados
          </h2>
         
        </div>

        <InfiniteRelatedProducts currentProduct={product} initialBatchSize={8} loadMoreBatchSize={8} />
      </div>
    </div>
  )
}
