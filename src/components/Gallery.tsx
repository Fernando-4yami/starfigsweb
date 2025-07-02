"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, Maximize2, ImageIcon, RotateCw, ZoomIn, ZoomOut, X } from "lucide-react"
import Image from "next/image"

interface GalleryProps {
  imageUrls: string[]
  galleryThumbnailUrls?: string[]
  blurPlaceholders?: string[]
  productName: string
}

type ViewMode = "carousel" | "fullscreen"

// 🆕 Componente optimizado para LCP
interface OptimizedImageProps {
  src: string
  blurSrc?: string
  alt: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  priority?: boolean // 🎯 Para LCP
  sizes?: string
}

function OptimizedImage({
  src,
  blurSrc,
  alt,
  className,
  style,
  onLoad,
  priority = false,
  sizes = "100vw",
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <ImageIcon className="w-16 h-16 text-gray-400" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* 🚀 NEXT.JS IMAGE OPTIMIZADO */}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        className={`object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority} // 🎯 CRÍTICO PARA LCP
        sizes={sizes}
        placeholder={blurSrc ? "blur" : "empty"}
        blurDataURL={blurSrc}
        quality={90} // 🎯 Alta calidad para imagen principal
      />

      {/* Loading indicator solo si no hay blur placeholder */}
      {!loaded && !blurSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}

export default function Gallery({ imageUrls, galleryThumbnailUrls, blurPlaceholders, productName }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>("carousel")
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })

  // Estados para el drag de las miniaturas
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  // 🎯 Función mejorada con mejor fallback
  const getThumbnailUrl = (index: number) => {
    const galleryThumb = galleryThumbnailUrls?.[index]
    const originalImage = imageUrls[index]
    return galleryThumb || originalImage
  }

  // 🆕 Función para obtener blur placeholder
  const getBlurPlaceholder = (index: number) => {
    return blurPlaceholders?.[index]
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (viewMode === "fullscreen") {
        switch (e.key) {
          case "Escape":
            setViewMode("carousel")
            break
          case "ArrowLeft":
            prevImage()
            break
          case "ArrowRight":
            nextImage()
            break
          case "+":
          case "=":
            setZoom((prev) => Math.min(prev + 0.2, 3))
            break
          case "-":
            setZoom((prev) => Math.max(prev - 0.2, 0.5))
            break
          case "r":
            setRotation((prev) => prev + 90)
            break
        }
      }
    },
    [viewMode],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Funciones para el drag de las miniaturas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setDragStart(null)
  }

  // Funciones para drag de miniaturas
  const handleThumbnailMouseDown = (e: React.MouseEvent) => {
    if (!thumbnailsRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    setStartX(e.pageX - thumbnailsRef.current.offsetLeft)
    setScrollLeft(thumbnailsRef.current.scrollLeft)
  }

  const handleThumbnailMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !thumbnailsRef.current) return
    e.preventDefault()
    const x = e.pageX - thumbnailsRef.current.offsetLeft
    const walk = (x - startX) * 2
    if (Math.abs(walk) > 5) {
      setHasMoved(true)
    }
    thumbnailsRef.current.scrollLeft = scrollLeft - walk
  }

  const handleThumbnailMouseUp = () => {
    setIsDragging(false)
    setTimeout(() => setHasMoved(false), 10)
  }

  const handleThumbnailMouseLeave = () => {
    setIsDragging(false)
    setTimeout(() => setHasMoved(false), 10)
  }

  // Touch events para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!thumbnailsRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    setStartX(e.touches[0].pageX - thumbnailsRef.current.offsetLeft)
    setScrollLeft(thumbnailsRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !thumbnailsRef.current) return
    const x = e.touches[0].pageX - thumbnailsRef.current.offsetLeft
    const walk = (x - startX) * 2
    if (Math.abs(walk) > 5) {
      setHasMoved(true)
    }
    thumbnailsRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setTimeout(() => setHasMoved(false), 10)
  }

  if (imageUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
        <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No hay imágenes disponibles</p>
      </div>
    )
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
    resetImageTransform()
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length)
    resetImageTransform()
  }

  const resetImageTransform = () => {
    setZoom(1)
    setRotation(0)
    setImagePosition({ x: 0, y: 0 })
  }

  if (viewMode === "fullscreen") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 text-white">
            <button
              onClick={() => setViewMode("carousel")}
              className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {imageUrls.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.5))}
              className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
              className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setRotation((prev) => prev + 90)}
              className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className="relative w-full h-full flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 🆕 FULLSCREEN: Imagen optimizada */}
          <OptimizedImage
            src={imageUrls[currentIndex]}
            blurSrc={getBlurPlaceholder(currentIndex)}
            alt={`${productName} imagen ${currentIndex + 1}`}
            className="max-w-full max-h-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
              cursor: zoom > 1 ? "move" : "default",
            }}
            sizes="100vw"
          />
        </div>

        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative">
        <div
          ref={containerRef}
          className="relative w-full h-96 md:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group"
        >
          {/* 🚀 IMAGEN PRINCIPAL OPTIMIZADA PARA LCP */}
          <OptimizedImage
            src={imageUrls[currentIndex]}
            blurSrc={getBlurPlaceholder(currentIndex)}
            alt={`${productName} imagen ${currentIndex + 1}`}
            priority={currentIndex === 0} // 🎯 PRIORITY SOLO PARA LA PRIMERA IMAGEN
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Fullscreen Button - Subtle */}
          <button
            onClick={() => setViewMode("fullscreen")}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {imageUrls.length}
          </div>
        </div>
      </div>

      {/* 🆕 MINIATURAS: Optimizadas con lazy loading */}
      <div
        ref={thumbnailsRef}
        className={`flex gap-3 overflow-x-auto pb-3 scrollbar-custom select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleThumbnailMouseDown}
        onMouseMove={handleThumbnailMouseMove}
        onMouseUp={handleThumbnailMouseUp}
        onMouseLeave={handleThumbnailMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {imageUrls.map((url, index) => (
          <button
            key={index}
            onClick={(e) => {
              if (!hasMoved) {
                setCurrentIndex(index)
              }
            }}
            className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition-all duration-300 ${
              index === currentIndex ? "ring-3 ring-blue-500 scale-105 shadow-lg" : "ring-1 ring-gray-200"
            }`}
          >
            {/* 🆕 MINIATURAS: Lazy loading excepto las primeras 3 */}
            <Image
              src={getThumbnailUrl(index) || "/placeholder.svg"}
              alt={`${productName} miniatura ${index + 1}`}
              fill
              className="object-cover"
              placeholder={getBlurPlaceholder(index) ? "blur" : "empty"}
              blurDataURL={getBlurPlaceholder(index)}
              loading={index < 3 ? "eager" : "lazy"} // 🎯 Eager para las primeras 3
              sizes="96px"
            />

            {index === currentIndex && <div className="absolute inset-0 bg-blue-500/20" />}
          </button>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-custom::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background-color: #f3f4f6;
          border-radius: 4px;
        }
        .scrollbar-custom {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  )
}
