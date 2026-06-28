import { NextResponse } from "next/server"
import type {
  FacebookReview,
  FacebookReviewsResponse,
} from "@/lib/facebook-reviews"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DEFAULT_PAGE_URL = "https://www.facebook.com/starfigss/reviews"
const SUCCESS_CACHE = "public, s-maxage=21600, stale-while-revalidate=604800"
const ERROR_CACHE = "public, s-maxage=300, stale-while-revalidate=1800"

interface GraphErrorPayload {
  error?: {
    code?: number
    message?: string
    type?: string
  }
}

interface GraphPage {
  name?: string
  link?: string
  rating_count?: number
  overall_star_rating?: number
}

interface GraphRating {
  id?: string
  created_time?: string
  rating?: number
  recommendation_type?: string
  review_text?: string
  reviewer?: {
    id?: string
    name?: string
  }
}

interface GraphRatingsResponse {
  data?: GraphRating[]
}

class GraphRequestError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message)
  }
}

function getApiVersion(): string {
  const configured = process.env.FACEBOOK_GRAPH_API_VERSION?.trim()
  return configured && /^v\d+\.\d+$/.test(configured) ? configured : "v20.0"
}

async function graphGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${getApiVersion()}/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  const payload = (await response.json()) as T & GraphErrorPayload

  if (!response.ok || payload.error) {
    throw new GraphRequestError(
      payload.error?.message || `Facebook request failed: ${response.status}`,
      payload.error?.code,
    )
  }

  return payload
}

function normalizeRecommendation(value?: string): boolean | null {
  const normalized = value?.toLowerCase()
  if (!normalized) return null
  if (["positive", "recommend", "recommends"].includes(normalized)) return true
  if (["negative", "doesnt_recommend", "does_not_recommend"].includes(normalized)) return false
  return null
}

function normalizeRating(review: GraphRating, index: number): FacebookReview | null {
  const text = String(review.review_text || "").replace(/\s+/g, " ").trim()
  if (!text) return null

  const reviewerName = String(review.reviewer?.name || "Cliente de Facebook")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
  const createdAt = review.created_time && !Number.isNaN(Date.parse(review.created_time))
    ? new Date(review.created_time).toISOString()
    : null
  const numericRating = Number(review.rating)

  return {
    id: String(
      review.id ||
        `${review.reviewer?.id || "anonymous"}-${review.created_time || index}`,
    ),
    reviewerName,
    text: text.slice(0, 1500),
    createdAt,
    recommends: normalizeRecommendation(review.recommendation_type),
    rating:
      Number.isFinite(numericRating) && numericRating >= 1 && numericRating <= 5
        ? numericRating
        : null,
  }
}

async function getRatings(pageId: string, accessToken: string): Promise<GraphRating[]> {
  const commonParams = {
    limit: "25",
  }

  try {
    const response = await graphGet<GraphRatingsResponse>(
      `${encodeURIComponent(pageId)}/ratings`,
      accessToken,
      {
        ...commonParams,
        fields:
          "id,created_time,rating,recommendation_type,review_text,reviewer",
      },
    )
    return response.data || []
  } catch (error) {
    if (!(error instanceof GraphRequestError) || error.code !== 100) throw error

    const fallback = await graphGet<GraphRatingsResponse>(
      `${encodeURIComponent(pageId)}/ratings`,
      accessToken,
      {
        ...commonParams,
        fields: "id,created_time,rating,review_text,reviewer",
      },
    )
    return fallback.data || []
  }
}

function createUnavailableResponse(
  reason: FacebookReviewsResponse["reason"],
  pageName = "Starfigs",
): FacebookReviewsResponse {
  return {
    available: false,
    page: {
      name: pageName,
      url: process.env.FACEBOOK_PAGE_URL?.trim() || DEFAULT_PAGE_URL,
      ratingCount: null,
      overallRating: null,
    },
    reviews: [],
    reason,
  }
}

export async function GET() {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim()
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()

  if (!pageId || !accessToken) {
    return NextResponse.json(createUnavailableResponse("not_configured"), {
      headers: { "Cache-Control": "no-store" },
    })
  }

  try {
    const pagePromise = graphGet<GraphPage>(
      encodeURIComponent(pageId),
      accessToken,
      {
        fields: "name,link,rating_count,overall_star_rating",
      },
    ).catch((error) => {
      console.warn("Facebook page summary unavailable:", error instanceof Error ? error.message : error)
      return {} as GraphPage
    })

    const [page, rawRatings] = await Promise.all([
      pagePromise,
      getRatings(pageId, accessToken),
    ])

    const reviews = rawRatings
      .map(normalizeRating)
      .filter((review): review is FacebookReview => Boolean(review))
      .sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
        return bTime - aTime
      })
      .slice(0, 6)

    const ratingCount = Number(page.rating_count)
    const overallRating = Number(page.overall_star_rating)
    const payload: FacebookReviewsResponse = {
      available: reviews.length > 0,
      page: {
        name: page.name?.trim() || "Starfigs",
        url:
          process.env.FACEBOOK_PAGE_URL?.trim() ||
          page.link ||
          DEFAULT_PAGE_URL,
        ratingCount: Number.isFinite(ratingCount) ? ratingCount : null,
        overallRating: Number.isFinite(overallRating) ? overallRating : null,
      },
      reviews,
      reason: reviews.length === 0 ? "no_reviews" : undefined,
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": SUCCESS_CACHE },
    })
  } catch (error) {
    console.error(
      "Facebook reviews unavailable:",
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(createUnavailableResponse("unavailable"), {
      headers: { "Cache-Control": ERROR_CACHE },
    })
  }
}
