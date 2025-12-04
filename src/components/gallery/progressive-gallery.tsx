"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react"

interface ProgressiveGalleryProps {
  imageUrls: string[]
  galleryThumbnailUrls?: string[]
  productName: string
  priority?: boolean
}

export default function ProgressiveGallery({
  imageUrls,
  galleryThumbnailUrls,
  productName,
  priority = false,
}: ProgressiveGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]))
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<number>>(new Set())
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setThumbnailsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleThumbnailClick = useCallback(
    (index: number) => {
      setSelectedIndex(index)

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
        {/* 🚀 IMAGEN PRINCIPAL CON DARK MODE */}
        <div className="relative group">
          <div className="relative w-full h-96 md:h-[500px] bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={imageUrls[selectedIndex] || "/placeholder.svg"}
              alt={`${productName} - Imagen ${selectedIndex + 1}`}
              fill
              priority={priority && selectedIndex === 0}
              className={`object-contain transition-all duration-300 ${
                loadedImages.has(selectedIndex) ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={() => setLoadedImages((prev) => new Set([...prev, selectedIndex]))}
              quality={90}
            />

            {/* 🚀 BLUR PLACEHOLDER CON DARK MODE */}
            {!loadedImages.has(selectedIndex) && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* 🚀 CONTROLES DE NAVEGACIÓN CON DARK MODE */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 🚀 BOTÓN PANTALLA COMPLETA CON DARK MODE */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-2 right-2 w-10 h-10 bg-black/50 dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Ver en pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* 🚀 INDICADOR DE IMAGEN CON DARK MODE */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 dark:bg-white/20 text-white text-xs px-2 py-1 rounded">
              {selectedIndex + 1} / {imageUrls.length}
            </div>
          </div>
        </div>

        {/* 🚀 MINIATURAS CON DARK MODE */}
        {thumbnailsLoaded && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {imageUrls.map((url, index) => {
              const thumbnailUrl = galleryThumbnailUrls?.[index] || url
              const isSelected = index === selectedIndex
              const isLoaded = loadedThumbnails.has(index)

              return (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800" 
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="w-full h-full bg-white dark:bg-gray-800">
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

                    {/* 🚀 BLUR PLACEHOLDER MINIATURA CON DARK MODE */}
                    {!isLoaded && (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 🚀 MODAL PANTALLA COMPLETA - FIXED CON TOP-0 PARA CUBRIR TODO */}
      {isFullscreen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] bg-black/95 dark:bg-black/98">
          {/* Contenedor centrado que ocupa todo el espacio */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Image
              src={imageUrls[selectedIndex] || "/placeholder.svg"}
              alt={`${productName} - Pantalla completa`}
              width={1600}
              height={1200}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              quality={95}
            />
          </div>

          {/* Controles pantalla completa */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-black/50 dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Cerrar pantalla completa"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicador pantalla completa */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 dark:bg-white/20 text-white px-4 py-2 rounded z-10">
            {selectedIndex + 1} / {imageUrls.length}
          </div>
        </div>
      )}

      {/* Estilos para scrollbar dark mode */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgb(156 163 175);
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgb(75 85 99);
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: rgb(243 244 246);
        }
        .dark .scrollbar-thin::-webkit-scrollbar-track {
          background-color: rgb(31 41 55);
        }
      `}</style>
    </>
  )
}