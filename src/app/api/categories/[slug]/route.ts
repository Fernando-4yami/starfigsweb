import { unstable_cache } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { categoryConfigs } from "@/config/categories"
import { getDb } from "@/lib/firebase/admin"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
  type PublicProduct,
} from "@/lib/api/public-product"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type SortOption = "newest" | "oldest" | "price-low" | "price-high"

function matchesLine(product: PublicProduct, term: string) {
  const line = (product.line || "").toLowerCase().trim()
  const normalizedTerm = term.toLowerCase().trim()

  return (
    line === normalizedTerm ||
    (line.includes(normalizedTerm) && normalizedTerm.length > 3) ||
    (normalizedTerm.includes(line) && line.length > 3)
  )
}

async function loadStoredLineTerms(slug: string): Promise<string[]> {
  if (slug !== "pricing") return []

  const snapshot = await getDb()
    .collection("categoryRules")
    .doc(slug)
    .get()
  const lines = snapshot.data()?.lines

  return Array.isArray(lines)
    ? lines
        .filter((line): line is string => typeof line === "string")
        .map((line) => line.trim())
        .filter(Boolean)
    : []
}

async function loadCategoryProducts(slug: string): Promise<PublicProduct[]> {
  const config = categoryConfigs[slug]
  if (!config) return []

  const collection = getDb().collection("products")
  const productsById = new Map<string, PublicProduct>()

  if (config.searchType === "line") {
    const storedTerms = await loadStoredLineTerms(slug)
    const terms = [
      ...new Set(
        [...config.searchTerms, ...storedTerms]
          .map((term) => term.trim())
          .filter(Boolean),
      ),
    ]
    const snapshots = await Promise.all(
      terms.map((term) =>
        collection
          .where("line", ">=", term)
          .where("line", "<=", `${term}\uf8ff`)
          .limit(1000)
          .select(...PUBLIC_PRODUCT_FIELDS)
          .get(),
      ),
    )

    snapshots.forEach((snapshot, index) => {
      const term = terms[index]
      snapshot.forEach((doc) => {
        const product = normalizePublicProduct(doc)
        if (matchesLine(product, term)) productsById.set(product.id, product)
      })
    })

    const brandTerms = [
      ...new Set((config.brandTerms || []).map((term) => term.trim()).filter(Boolean)),
    ]
    const brandSnapshots = await Promise.all(
      brandTerms.map((brand) =>
        collection
          .where("brand", "==", brand)
          .limit(1000)
          .select(...PUBLIC_PRODUCT_FIELDS)
          .get(),
      ),
    )

    brandSnapshots.forEach((snapshot) => {
      snapshot.forEach((doc) => {
        const product = normalizePublicProduct(doc)
        productsById.set(product.id, product)
      })
    })
  } else if (config.slug === "plush") {
    const snapshot = await collection
      .where("category", "==", "plush")
      .limit(1000)
      .select(...PUBLIC_PRODUCT_FIELDS)
      .get()

    snapshot.forEach((doc) => {
      productsById.set(doc.id, normalizePublicProduct(doc))
    })
  } else {
    const snapshot = await collection
      .orderBy("createdAt", "desc")
      .limit(500)
      .select(...PUBLIC_PRODUCT_FIELDS)
      .get()

    const terms = config.searchTerms.map((term) => term.toLowerCase())

    snapshot.forEach((doc) => {
      const product = normalizePublicProduct(doc)
      const name = product.name.toLowerCase()
      const line = (product.line || "").toLowerCase()
      const brand = (product.brand || "").toLowerCase()
      const matchesName = terms.some(
        (term) => name.includes(term) || line.includes(term) || brand.includes(term),
      )
      const matchesScale =
        (!!product.scale && product.scale.includes("/")) ||
        /1\/[0-9]+/.test(product.name) ||
        (brand.includes("kotobukiya") &&
          !line.includes("nendoroid") &&
          !line.includes("figma")) ||
        brand.includes("alter") ||
        (brand.includes("good smile") && line.includes("scale"))

      if (
        (config.searchType === "name" && matchesName) ||
        (config.searchType === "scale" && matchesScale)
      ) {
        productsById.set(product.id, product)
      }
    })
  }

  return [...productsById.values()]
}

const getCachedCategoryProducts = unstable_cache(
  loadCategoryProducts,
  ["category-products-v3"],
  { revalidate: 21600, tags: ["category-products"] },
)

function parseInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function parseNumber(value: string | null, fallback: number) {
  if (value === null || value.trim() === "") return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseSort(value: string | null): SortOption {
  if (
    value === "oldest" ||
    value === "price-low" ||
    value === "price-high"
  ) {
    return value
  }
  return "newest"
}

function countValues(
  products: PublicProduct[],
  getValue: (product: PublicProduct) => string | undefined,
) {
  return products.reduce<Record<string, number>>((counts, product) => {
    const value = getValue(product)
    if (value) counts[value] = (counts[value] || 0) + 1
    return counts
  }, {})
}

function buildFilterOptions(
  products: PublicProduct[],
  seriesList: string[],
) {
  const excludedCategories = new Set(["figura", "figuras", "figure"])
  const brandCounts = countValues(products, (product) => product.brand)
  const categoryCounts = countValues(products, (product) =>
    product.category && !excludedCategories.has(product.category.toLowerCase())
      ? product.category
      : undefined,
  )
  const scaleCounts = countValues(products, (product) => product.scale)
  const lineCounts = countValues(products, (product) => product.line)
  const seriesCounts = seriesList.reduce<Record<string, number>>(
    (counts, series) => {
      const normalized = series.toLowerCase()
      const count = products.filter((product) =>
        product.name.toLowerCase().includes(normalized),
      ).length
      if (count > 0) counts[series] = count
      return counts
    },
    {},
  )
  const prices = products.map((product) => product.price).filter(Boolean)

  return {
    brands: Object.keys(brandCounts).sort(),
    categories: Object.keys(categoryCounts).sort(),
    scales: Object.keys(scaleCounts).sort(),
    lines: Object.keys(lineCounts).sort(),
    series: Object.keys(seriesCounts),
    priceRange: {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 1000),
    },
    counts: {
      brands: brandCounts,
      categories: categoryCounts,
      scales: scaleCounts,
      lines: lineCounts,
      series: seriesCounts,
    },
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const config = categoryConfigs[params.slug]
  if (!config) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInteger(searchParams.get("page"), 1, 1, 500)
    const limit = parseInteger(searchParams.get("limit"), 20, 8, 40)
    const sort = parseSort(searchParams.get("sort"))
    const brands = new Set(searchParams.getAll("brand"))
    const categories = new Set(searchParams.getAll("category"))
    const series = searchParams.getAll("series")
    const scales = new Set(searchParams.getAll("scale"))
    const lines = new Set(searchParams.getAll("line"))
    const minPrice = parseNumber(searchParams.get("minPrice"), 0)
    const maxPrice = parseNumber(searchParams.get("maxPrice"), 1000)
    const minHeight = parseNumber(searchParams.get("minHeight"), 0)
    const maxHeight = parseNumber(searchParams.get("maxHeight"), 50)
    const availability = searchParams.get("availability")

    const allProducts = await getCachedCategoryProducts(params.slug)
    const filterOptions = buildFilterOptions(allProducts, config.seriesList)
    const now = new Date()

    const filteredProducts = allProducts.filter((product) => {
      if (brands.size > 0 && !brands.has(product.brand || "")) return false
      if (categories.size > 0 && !categories.has(product.category || "")) return false
      if (scales.size > 0 && !scales.has(product.scale || "")) return false
      if (lines.size > 0 && !lines.has(product.line || "")) return false

      if (
        series.length > 0 &&
        !series.some((item) =>
          product.name.toLowerCase().includes(item.toLowerCase()),
        )
      ) {
        return false
      }

      if (product.price < minPrice || product.price > maxPrice) return false
      if (
        product.heightCm &&
        (product.heightCm < minHeight || product.heightCm > maxHeight)
      ) {
        return false
      }

      if (availability === "future") {
        if (!product.releaseDate) return false
        const releaseDate = new Date(product.releaseDate)
        const isFuture =
          releaseDate.getFullYear() > now.getFullYear() ||
          (releaseDate.getFullYear() === now.getFullYear() &&
            releaseDate.getMonth() > now.getMonth())
        if (!isFuture) return false
      }

      if (availability === "released" && product.releaseDate) {
        const releaseDate = new Date(product.releaseDate)
        const isCurrentOrPast =
          releaseDate.getFullYear() < now.getFullYear() ||
          (releaseDate.getFullYear() === now.getFullYear() &&
            releaseDate.getMonth() <= now.getMonth())
        if (!isCurrentOrPast) return false
      }

      return true
    })

    filteredProducts.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          )
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          )
      }
    })

    const total = filteredProducts.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * limit

    return NextResponse.json(
      {
        products: filteredProducts.slice(startIndex, startIndex + limit),
        total,
        page: safePage,
        limit,
        totalPages,
        filterOptions,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error(`Error loading category ${params.slug}:`, error)
    return NextResponse.json(
      { error: "Unable to load category" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
