import type {
  CompactSearchIndexEntry,
  SearchIndexEntry,
} from "@/lib/search/index-types"
import { expandImageUrl } from "@/lib/search/image-url"
import { normalizeSearchText } from "@/lib/search/normalize"
import type { SearchProduct } from "@/lib/search/types"

const SEARCH_INDEX_TTL = 15 * 60 * 1000

interface RankedEntry {
  entry: SearchIndexEntry
  score: number
}

let cachedIndex: SearchIndexEntry[] | null = null
let cachedAt = 0
let pendingIndex: Promise<SearchIndexEntry[]> | null = null

function expandIndexEntry(entry: CompactSearchIndexEntry): SearchIndexEntry {
  const [
    id,
    name,
    slug,
    price,
    imageUrl,
    thumbnailUrl,
    brand,
    line,
    createdAtMs,
    releaseDate,
    heightCm,
    scale,
    views,
    discount,
    searchableText,
  ] = entry

  const expandedImageUrl = expandImageUrl(imageUrl)
  const product: SearchProduct = {
    id,
    name,
    slug,
    price,
    imageUrls: expandedImageUrl ? [expandedImageUrl] : [],
    thumbnailUrl: expandImageUrl(thumbnailUrl) || undefined,
    brand: brand || undefined,
    line: line || undefined,
    releaseDate,
    heightCm: heightCm || undefined,
    scale: scale || undefined,
    views,
    discount: discount
      ? {
          isActive: discount[0],
          type: discount[1],
          value: discount[2],
          startDate: discount[3],
          endDate: discount[4],
        }
      : undefined,
  }

  return {
    product,
    searchableText,
    normalizedName: normalizeSearchText(name),
    normalizedBrand: normalizeSearchText(brand),
    normalizedLine: normalizeSearchText(line),
    createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
  }
}

async function loadSearchIndex(origin: string): Promise<SearchIndexEntry[]> {
  const response = await fetch(`${origin}/api/search-index`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Search index request failed: ${response.status}`)
  }

  const compactIndex = (await response.json()) as CompactSearchIndexEntry[]
  if (!Array.isArray(compactIndex)) throw new Error("Search index response is invalid")
  return compactIndex.map(expandIndexEntry)
}

async function getSearchIndex(origin: string): Promise<SearchIndexEntry[]> {
  const now = Date.now()
  if (cachedIndex && now - cachedAt < SEARCH_INDEX_TTL) return cachedIndex
  if (pendingIndex) return pendingIndex

  pendingIndex = loadSearchIndex(origin)
    .then((index) => {
      cachedIndex = index
      cachedAt = Date.now()
      return index
    })
    .catch((error) => {
      if (cachedIndex) {
        console.warn("Search index refresh failed; using stale index:", error)
        return cachedIndex
      }
      throw error
    })
    .finally(() => {
      pendingIndex = null
    })

  return pendingIndex
}

function scoreEntry(
  entry: SearchIndexEntry,
  phrase: string,
  words: string[],
  now: number,
): number {
  let score = 0

  if (entry.normalizedName === phrase) score += 1200
  if (entry.normalizedName.startsWith(phrase)) score += 600
  if (entry.normalizedName.includes(phrase)) score += 300
  if (entry.normalizedBrand === phrase || entry.normalizedLine === phrase) score += 250
  if (entry.normalizedBrand.includes(phrase) || entry.normalizedLine.includes(phrase)) score += 120

  for (const word of words) {
    if (entry.normalizedName.startsWith(word)) score += 80
    else if (entry.normalizedName.includes(word)) score += 50

    if (entry.normalizedBrand.includes(word)) score += 25
    if (entry.normalizedLine.includes(word)) score += 25
  }

  score += Math.min(Math.log10((entry.product.views || 0) + 1) * 8, 32)

  const ageInDays = (now - entry.createdAtMs) / 86_400_000
  if (entry.createdAtMs > 0 && ageInDays >= 0 && ageInDays <= 30) {
    score += Math.max(0, 12 - ageInDays * 0.4)
  }

  return score
}

async function findRankedEntries(query: string, origin: string): Promise<RankedEntry[]> {
  const phrase = normalizeSearchText(query)
  const words = phrase.split(" ").filter(Boolean)
  if (!phrase || words.length === 0) return []

  const index = await getSearchIndex(origin)
  const matches: RankedEntry[] = []
  const now = Date.now()

  for (const entry of index) {
    if (!words.every((word) => entry.searchableText.includes(word))) continue

    matches.push({
      entry,
      score: scoreEntry(entry, phrase, words, now),
    })
  }

  matches.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    return b.entry.createdAtMs - a.entry.createdAtMs
  })

  return matches
}

export async function searchCatalog(
  query: string,
  requestedPage: number,
  limit: number,
  origin: string,
) {
  const matches = await findRankedEntries(query, origin)
  const total = matches.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * limit

  return {
    products: matches.slice(offset, offset + limit).map(({ entry }) => entry.product),
    total,
    page,
    limit,
    totalPages,
  }
}

const GENERIC_SUGGESTION_WORD =
  /^(ver|version|type|the|anime|figure|figura|original|limited|exclusive|special|set|bunny|bare|leg|dx|reissue|re|edition|release|final|battle|awakening|awakened|mode|form|edit|another|extra|secret|rare|normal)$/i

export async function getSearchSuggestions(
  query: string,
  limit: number,
  origin: string,
): Promise<string[]> {
  const phrase = normalizeSearchText(query)
  const matches = (await findRankedEntries(query, origin)).slice(0, 100)
  const knownLabels = new Set<string>()

  for (const { entry } of matches) {
    if (entry.normalizedBrand) knownLabels.add(entry.normalizedBrand)
    if (entry.normalizedLine) knownLabels.add(entry.normalizedLine)
  }

  const suggestions: string[] = []
  const seen = new Set<string>()

  const addSuggestion = (candidate: string) => {
    const cleaned = candidate.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim()
    const normalized = normalizeSearchText(cleaned)
    if (
      !cleaned ||
      cleaned.length < 2 ||
      !normalized.includes(phrase) ||
      seen.has(normalized) ||
      GENERIC_SUGGESTION_WORD.test(normalized)
    ) {
      return
    }

    seen.add(normalized)
    suggestions.push(cleaned)
  }

  for (const { entry } of matches) {
    if (suggestions.length >= limit) break

    if (entry.normalizedBrand.includes(phrase)) addSuggestion(entry.product.brand || "")
    if (suggestions.length >= limit) break
    if (entry.normalizedLine.includes(phrase)) addSuggestion(entry.product.line || "")

    const segments = entry.product.name.split(/[-\u2013\u2014/\u00b7|]+/)
    for (const rawSegment of segments) {
      if (suggestions.length >= limit) break

      const filteredWords = rawSegment
        .trim()
        .split(/\s+/)
        .filter(
          (word) =>
            !knownLabels.has(normalizeSearchText(word)) && !GENERIC_SUGGESTION_WORD.test(word),
        )

      addSuggestion(filteredWords.join(" "))
    }
  }

  return suggestions.slice(0, limit)
}
