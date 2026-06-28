import { Suspense } from "react"
import type { Metadata } from "next"
import SearchPageClient from "./SearchPageClient"

export const metadata: Metadata = {
  title: "Buscar productos",
  robots: {
    index: false,
    follow: true,
  },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ""
  const parsedPage = Number.parseInt(params.page || "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SearchPageClient initialQuery={query} initialPage={page} />
    </Suspense>
  )
}
