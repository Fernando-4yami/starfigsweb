export interface FacebookReview {
  id: string
  reviewerName: string
  text: string
  createdAt: string | null
  recommends: boolean | null
  rating: number | null
}

export interface FacebookReviewsResponse {
  available: boolean
  page: {
    name: string
    url: string
    ratingCount: number | null
    overallRating: number | null
  }
  reviews: FacebookReview[]
  reason?: "not_configured" | "unavailable" | "no_reviews"
}
