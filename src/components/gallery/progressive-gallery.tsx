"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react"

interface ProgressiveGalleryProps {
  imageUrls: string[]
  galleryThumbnailUrls?: string[]
  productName: string
  priority?: boolean // 🚀 NUEVO PROP PARA LCP
}

export default function ProgressiveGallery({
  imageUrls,
  galleryThumbnailUrls,
  productName,
  priority = false,
}: ProgressiveGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0])) // Principal ya cargada
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<number>>(new Set())
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false)

  // 🚀 CARGAR MINIATURAS DESPUÉS DE LA PRINCIPAL
  useEffect(() => {
    const timer = setTimeout(() => {
      setThumbnailsLoaded(true)
    }, 500) // Delay para que cargue después de la principal

    return () => clearTimeout(timer)
  }, [])

  // 🚀 PRECARGAR IMAGEN CUANDO SE SELECCIONA MINIATURA
  const handleThumbnailClick = useCallback(
    (index: number) => {
      setSelectedIndex(index)

      // Precargar imagen si no está cargada
      if (!loadedImages.has(index)) {
        const img = new window.Image()
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, index]))
        }
        img.src = imageUrls[index]
      }
    },
    [imageUrls, loadedImages],
  )

  const handleThumbnailLoad = useCallback((index: number) => {
    setLoadedThumbnails((prev) => new Set([...prev, index]))
  }, [])

  const nextImage = useCallback(() => {
    const newIndex = (selectedIndex + 1) % imageUrls.length
    handleThumbnailClick(newIndex)
  }, [selectedIndex, imageUrls.length, handleThumbnailClick])

  const prevImage = useCallback(() => {
    const newIndex = selectedIndex === 0 ? imageUrls.length - 1 : selectedIndex - 1
    handleThumbnailClick(newIndex)
  }, [selectedIndex, imageUrls.length, handleThumbnailClick])

  // 🚀 KEYBOARD NAVIGATION
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === "ArrowLeft") prevImage()
        if (e.key === "ArrowRight") nextImage()
        if (e.key === "Escape") setIsFullscreen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen, nextImage, prevImage])

  if (imageUrls.length <= 1) return null

  return (
    <>
      <div className="space-y-4">
        {/* 🚀 IMAGEN PRINCIPAL - SIN LUPA */}
        <div className="relative group">
          <div className="relative w-full h-96 md:h-[500px] bg-gray-100 rounded-xl overflow-hidden">
            <Image
              src={imageUrls[selectedIndex] || "/placeholder.svg"}
              alt={`${productName} - Imagen ${selectedIndex + 1}`}
              fill
              priority={priority && selectedIndex === 0} // 🚀 PRIORITY SOLO PARA LA PRIMERA
              className={`object-contain transition-all duration-300 ${
                loadedImages.has(selectedIndex) ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={() => setLoadedImages((prev) => new Set([...prev, selectedIndex]))}
              quality={90}
            />

            {/* 🚀 BLUR PLACEHOLDER */}
            {!loadedImages.has(selectedIndex) && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* 🚀 CONTROLES DE NAVEGACIÓN */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 🚀 BOTÓN PANTALLA COMPLETA */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-2 right-2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Ver en pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* 🚀 INDICADOR DE IMAGEN */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {selectedIndex + 1} / {imageUrls.length}
            </div>
          </div>
        </div>

        {/* 🚀 MINIATURAS - CARGAN DESPUÉS */}
        {thumbnailsLoaded && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {imageUrls.map((url, index) => {
              const thumbnailUrl = galleryThumbnailUrls?.[index] || url
              const isSelected = index === selectedIndex
              const isLoaded = loadedThumbnails.has(index)

              return (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={thumbnailUrl || "/placeholder.svg"}
                    alt={`${productName} miniatura ${index + 1}`}
                    fill
                    className={`object-cover transition-all duration-300 ${
                      isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
                    }`}
                    sizes="64px"
                    onLoad={() => handleThumbnailLoad(index)}
                    quality={60}
                  />

                  {/* 🚀 BLUR PLACEHOLDER MINIATURA */}
                  {!isLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 🚀 MODAL PANTALLA COMPLETA - CENTRADO PERFECTO */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Contenedor centrado */}
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <Image
              src={imageUrls[selectedIndex] || "/placeholder.svg"}
              alt={`${productName} - Pantalla completa`}
              width={1200}
              height={800}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              quality={95}
            />
          </div>

          {/* Controles pantalla completa */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Cerrar pantalla completa"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicador pantalla completa */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded">
            {selectedIndex + 1} / {imageUrls.length}
          </div>
        </div>
      )}
    </>
  )
}
