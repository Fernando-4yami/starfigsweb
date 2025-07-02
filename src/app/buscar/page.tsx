import { Suspense } from "react"
import SearchPageClient from "./SearchPageClient"

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ""
  const page = Number.parseInt(params.page || "1", 10)

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
