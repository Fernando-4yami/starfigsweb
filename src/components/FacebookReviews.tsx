"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ExternalLink,
  MessageCircle,
  Quote,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import type {
  FacebookReview,
  FacebookReviewsResponse,
} from "@/lib/facebook-reviews"

const FALLBACK_PAGE_URL = "https://www.facebook.com/starfigss/reviews"

function formatReviewDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function ReviewCard({ review }: { review: FacebookReview }) {
  const date = formatReviewDate(review.createdAt)

  return (
    <article className="flex min-h-[260px] w-[82vw] max-w-[330px] shrink-0 snap-start flex-col rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:h-full md:w-auto md:max-w-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {getInitials(review.reviewerName) || "FB"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {review.reviewerName}
            </p>
            {date && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
            )}
          </div>
        </div>
        <Quote className="h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
      </div>

      <p className="mb-5 line-clamp-6 text-sm leading-6 text-gray-700 dark:text-gray-300">
        {review.text}
      </p>

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-medium dark:border-gray-700">
        {review.recommends === false ? (
          <>
            <ThumbsDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-gray-600 dark:text-gray-400">No recomienda</span>
          </>
        ) : review.recommends === true ? (
          <>
            <ThumbsUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span className="text-emerald-700 dark:text-emerald-400">Recomienda</span>
          </>
        ) : (
          <span className="text-gray-600 dark:text-gray-400">Reseña en Facebook</span>
        )}
        {review.rating && (
          <span className="ml-auto flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            {review.rating.toFixed(1)}
          </span>
        )}
      </div>
    </article>
  )
}

function ReviewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-60 animate-pulse rounded-md border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700" />
              <div className="h-2.5 w-1/3 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FacebookReviews() {
  const sectionRef = useRef<HTMLElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [payload, setPayload] = useState<FacebookReviewsResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || shouldLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: "500px 0px" },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [shouldLoad])

  useEffect(() => {
    if (!shouldLoad) return

    const controller = new AbortController()
    fetch("/api/facebook-reviews", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Reviews request failed: ${response.status}`)
        return (await response.json()) as FacebookReviewsResponse
      })
      .then(setPayload)
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error("Error loading Facebook reviews:", error)
        setFailed(true)
      })

    return () => controller.abort()
  }, [shouldLoad])

  const pageUrl = payload?.page.url || FALLBACK_PAGE_URL
  const hasReviews = Boolean(payload?.available && payload.reviews.length > 0)
  const summary = useMemo(() => {
    if (!payload?.page) return null
    const { overallRating, ratingCount } = payload.page
    if (!overallRating && !ratingCount) return null
    return { overallRating, ratingCount }
  }, [payload])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="facebook-reviews-title"
      className="border-y border-gray-200 bg-gray-100 py-16 dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Reseñas en Facebook
            </div>
            <h2
              id="facebook-reviews-title"
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl"
            >
              Lo que dicen nuestros clientes
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {summary && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                {summary.overallRating && (
                  <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                    {summary.overallRating.toFixed(1)}
                  </span>
                )}
                {summary.ratingCount && <span>{summary.ratingCount} opiniones</span>}
              </div>
            )}
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Ver todas
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {!shouldLoad || (!payload && !failed) ? (
          <ReviewsSkeleton />
        ) : hasReviews ? (
          <div className="reviews-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
            {payload!.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="border-l-4 border-blue-600 bg-white px-5 py-6 dark:bg-gray-900">
            <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
              Consulta las recomendaciones publicadas por nuestros clientes directamente en Facebook.
            </p>
          </div>
        )}
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
