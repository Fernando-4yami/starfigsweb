"use client"

import { useRef } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Quote,
  ThumbsUp,
} from "lucide-react"
import {
  FACEBOOK_REVIEWS_URL,
  facebookTestimonials,
  type FacebookTestimonial,
} from "@/lib/facebook-reviews"

function ReviewCard({ review }: { review: FacebookTestimonial }) {
  return (
    <article className="flex min-h-[250px] w-[82vw] max-w-[340px] shrink-0 snap-start flex-col rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:w-[calc((100%_-_1rem)/2)] md:max-w-none xl:w-[calc((100%_-_2rem)/3)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <a
          href={review.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-blue-50 dark:bg-blue-950">
            <img
              src={review.avatarPath}
              alt={review.reviewerName}
              width={44}
              height={44}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {review.reviewerName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recomendación en Facebook
            </p>
          </div>
        </a>

        <Quote className="h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
      </div>

      <p className="mb-5 text-[15px] leading-7 text-gray-700 dark:text-gray-300">
        “{review.text}”
      </p>

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-semibold text-emerald-700 dark:border-gray-800 dark:text-emerald-400">
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        Recomienda StarFigs
      </div>
    </article>
  )
}

export default function FacebookReviews() {
  const reviewsRef = useRef<HTMLDivElement>(null)

  const moveReviews = (direction: -1 | 1) => {
    const list = reviewsRef.current
    if (!list) return

    list.scrollBy({
      left: direction * list.clientWidth * 0.85,
      behavior: "smooth",
    })
  }

  return (
    <section
      aria-labelledby="facebook-reviews-title"
      className="border-y border-gray-200 bg-gray-100 py-16 dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2
              id="facebook-reviews-title"
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl"
            >
              Experiencias de nuestros clientes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Las recomendaciones públicas compartidas en nuestra página de Facebook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveReviews(-1)}
                aria-label="Ver reseñas anteriores"
                title="Reseñas anteriores"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveReviews(1)}
                aria-label="Ver más reseñas"
                title="Más reseñas"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <a
              href={FACEBOOK_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              Ver en Facebook
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div
          ref={reviewsRef}
          className="reviews-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3"
        >
          {facebookTestimonials.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .reviews-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .reviews-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
