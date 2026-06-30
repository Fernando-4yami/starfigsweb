"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react"
import { hobbySearchBannerItems } from "@/lib/hobbysearch/banner"

const AUTOPLAY_INTERVAL_MS = 6_500

export default function HobbySearchBanner() {
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)

  const itemCount = hobbySearchBannerItems.length
  const isAutoplayPaused = isManuallyPaused || isInteracting

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    const slide = track?.children[index] as HTMLElement | undefined
    if (!track || !slide) return

    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: "smooth",
    })
    setActiveIndex(index)
  }

  const move = (direction: -1 | 1) => {
    if (itemCount <= 1) return
    const nextIndex = (activeIndex + direction + itemCount) % itemCount
    scrollToIndex(nextIndex)
  }

  const syncActiveSlide = () => {
    if (scrollFrameRef.current !== null) return

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const track = trackRef.current
      if (!track) {
        scrollFrameRef.current = null
        return
      }

      const slides = Array.from(track.children) as HTMLElement[]
      const nearestIndex = slides.reduce(
        (bestIndex, slide, index) =>
          Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft) <
          Math.abs(
            slides[bestIndex].offsetLeft -
              track.offsetLeft -
              track.scrollLeft,
          )
            ? index
            : bestIndex,
        0,
      )

      setActiveIndex(nearestIndex)
      scrollFrameRef.current = null
    })
  }

  useEffect(() => {
    if (isAutoplayPaused || itemCount <= 1) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % itemCount
        const track = trackRef.current
        const slide = track?.children[nextIndex] as HTMLElement | undefined

        if (track && slide) {
          track.scrollTo({
            left: slide.offsetLeft - track.offsetLeft,
            behavior: "smooth",
          })
        }

        return nextIndex
      })
    }, AUTOPLAY_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [isAutoplayPaused, itemCount])

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
      }
    },
    [],
  )

  if (itemCount === 0) return null

  return (
    <section
      aria-label="Productos destacados"
      className="mx-auto mb-14 max-w-7xl px-4 pt-2 md:px-6"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocus={() => setIsInteracting(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsInteracting(false)
        }
      }}
    >
      <div
        ref={trackRef}
        onScroll={syncActiveSlide}
        className="hobbysearch-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth overscroll-x-contain"
      >
        {hobbySearchBannerItems.map((item, index) => (
          <Link
            key={item.sourceId}
            href={`/products/${item.productSlug}`}
            aria-label={`Ver ${item.productName}`}
            className="block w-[86vw] max-w-[640px] shrink-0 snap-start overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-offset-gray-900"
          >
            <img
              src={item.imagePath}
              alt={item.productName}
              width={item.width}
              height={item.height}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              className="block aspect-[2/1] h-auto w-full object-cover"
            />
          </Link>
        ))}
      </div>

      {itemCount > 1 && (
        <div className="mt-4">
          <div
            className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
              style={{ width: `${((activeIndex + 1) / itemCount) * 100}%` }}
            />
          </div>

          <div className="mt-3 flex min-h-10 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Banner anterior"
                title="Banner anterior"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Siguiente banner"
                title="Siguiente banner"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {hobbySearchBannerItems.map((item, index) => (
                <button
                  key={item.sourceId}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  aria-label={`Ir al banner ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={`h-2.5 w-2.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                    index === activeIndex
                      ? "bg-blue-600"
                      : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={() => setIsManuallyPaused((current) => !current)}
                aria-label={
                  isManuallyPaused
                    ? "Reanudar banners automáticos"
                    : "Pausar banners automáticos"
                }
                title={isManuallyPaused ? "Reanudar" : "Pausar"}
                className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {isManuallyPaused ? (
                  <Play className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hobbysearch-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hobbysearch-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
