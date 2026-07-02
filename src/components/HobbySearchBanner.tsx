"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import {
  Splide,
  SplideSlide,
  SplideTrack,
} from "@splidejs/react-splide"
import type { Options } from "@splidejs/splide"
import { hobbySearchBannerItems } from "@/lib/hobbysearch/banner"

const carouselOptions: Options = {
  type: "loop",
  fixedWidth: 560,
  focus: "center",
  gap: "3.2rem",
  perMove: 1,
  speed: 650,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  drag: true,
  flickMaxPages: 1,
  waitForTransition: true,
  trimSpace: false,
  updateOnMove: true,
  arrows: true,
  pagination: true,
  paginationKeyboard: true,
  keyboard: true,
  autoplay: true,
  interval: 6_500,
  pauseOnHover: true,
  pauseOnFocus: true,
  resetProgress: true,
  live: true,
  breakpoints: {
    767: {
      fixedWidth: "calc(100vw - 2rem)",
      gap: "1rem",
    },
  },
  reducedMotion: {
    speed: 0,
    autoplay: "pause",
  },
  i18n: {
    prev: "Banner anterior",
    next: "Siguiente banner",
    first: "Ir al primer banner",
    last: "Ir al ultimo banner",
    slideX: "Ir al banner %s",
    pageX: "Ir a la pagina %s",
    play: "Reanudar banners automaticos",
    pause: "Pausar banners automaticos",
    carousel: "carrusel",
    slide: "banner",
    select: "Selecciona un banner",
    slideLabel: "%s de %s",
  },
}

function BannerImage({
  item,
  eager,
}: {
  item: (typeof hobbySearchBannerItems)[number]
  eager: boolean
}) {
  return (
    <Link
      href={`/products/${item.productSlug}`}
      aria-label={`Ver ${item.productName}`}
      className="block overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-offset-gray-900"
    >
      <img
        src={item.imagePath}
        srcSet={
          item.imagePath2x
            ? `${item.imagePath} 1x, ${item.imagePath2x} 2x`
            : undefined
        }
        alt={item.productName}
        width={item.width}
        height={item.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        draggable={false}
        className="block aspect-[2/1] h-auto w-full object-cover"
      />
    </Link>
  )
}

export default function HobbySearchBanner() {
  const itemCount = hobbySearchBannerItems.length

  if (itemCount === 0) return null

  if (itemCount === 1) {
    return (
      <section
        aria-label="Producto destacado"
        className="mx-auto mb-8 max-w-[560px] px-4 pt-2"
      >
        <BannerImage item={hobbySearchBannerItems[0]} eager />
      </section>
    )
  }

  return (
    <Splide
      tag="section"
      hasTrack={false}
      options={carouselOptions}
      aria-label="Productos destacados"
      className="hobbysearch-carousel mx-auto mb-8 max-w-[1536px] px-4 pt-2 md:px-6"
    >
      <SplideTrack>
        {hobbySearchBannerItems.map((item, index) => (
          <SplideSlide key={item.sourceId}>
            <BannerImage item={item} eager={index === 0} />
          </SplideSlide>
        ))}
      </SplideTrack>

      <div className="mx-auto mt-3 grid min-h-10 grid-cols-[auto_minmax(2rem,1fr)_auto] items-center gap-3">
        <div className="splide__arrows flex items-center gap-2">
          <button
            type="button"
            className="splide__arrow splide__arrow--prev inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="splide__arrow splide__arrow--next inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="splide__progress h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          aria-hidden="true"
        >
          <div className="splide__progress__bar h-full rounded-full bg-blue-600" />
        </div>

        <div className="flex items-center gap-3">
          <ul className="splide__pagination gap-2" />
          <button
            type="button"
            className="splide__toggle inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Pausar o reanudar banners"
          >
            <span className="splide__toggle__play">
              <Play className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="splide__toggle__pause">
              <Pause className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .hobbysearch-carousel .splide__track {
          padding-bottom: 0.25rem;
        }

        .hobbysearch-carousel .splide__slide > a {
          opacity: 0.72;
          transform: scale(0.96);
          transition:
            opacity 350ms ease,
            transform 650ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 200ms ease;
        }

        .hobbysearch-carousel .splide__slide.is-active > a {
          opacity: 1;
          transform: scale(1);
        }

        .hobbysearch-carousel .splide__pagination__page {
          width: 0.625rem;
          height: 0.625rem;
          padding: 0;
          border: 0;
          border-radius: 9999px;
          background: rgb(209 213 219);
          cursor: pointer;
          transition:
            background-color 150ms ease,
            transform 150ms ease;
        }

        .hobbysearch-carousel .splide__pagination__page:hover {
          background: rgb(156 163 175);
        }

        .hobbysearch-carousel .splide__pagination__page.is-active {
          background: rgb(37 99 235);
          transform: scale(1.15);
        }

        .dark .hobbysearch-carousel .splide__pagination__page {
          background: rgb(75 85 99);
        }

        .dark .hobbysearch-carousel .splide__pagination__page:hover {
          background: rgb(107 114 128);
        }

        .dark .hobbysearch-carousel .splide__pagination__page.is-active {
          background: rgb(37 99 235);
        }

        @media (prefers-reduced-motion: reduce) {
          .hobbysearch-carousel .splide__slide > a {
            transition: none;
          }
        }
      `}</style>
    </Splide>
  )
}
