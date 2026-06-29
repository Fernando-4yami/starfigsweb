import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
  type PublicProduct,
} from "@/lib/api/public-product"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function loadRelatedProducts(productId: string) {
  const collection = getDb().collection("products")
  const currentSnapshot = await collection.doc(productId).get()
  if (!currentSnapshot.exists) return null

  const current = currentSnapshot.data() || {}
  const productsById = new Map<string, { product: PublicProduct; weight: number }>()

  const queryAndAdd = async (
    field: "line" | "brand" | "category",
    value: string,
    limit: number,
    weight: number,
  ) => {
    const snapshot = await collection
      .where(field, "==", value)
      .limit(limit)
      .select(...PUBLIC_PRODUCT_FIELDS)
      .get()

    snapshot.docs.forEach((doc) => {
      if (doc.id === productId) return

      const existing = productsById.get(doc.id)
      if (existing) {
        existing.weight = Math.max(existing.weight, weight)
      } else {
        productsById.set(doc.id, {
          product: normalizePublicProduct(doc),
          weight,
        })
      }
    })
  }

  const queries: Promise<void>[] = []
  if (current.line) queries.push(queryAndAdd("line", current.line, 25, 1000))
  if (current.brand) queries.push(queryAndAdd("brand", current.brand, 15, 500))
  if (current.category) queries.push(queryAndAdd("category", current.category, 15, 100))
  await Promise.all(queries)

  if (productsById.size === 0) {
    const fallback = await collection
      .orderBy("createdAt", "desc")
      .limit(21)
      .select(...PUBLIC_PRODUCT_FIELDS)
      .get()

    fallback.docs.forEach((doc) => {
      if (doc.id !== productId) {
        productsById.set(doc.id, {
          product: normalizePublicProduct(doc),
          weight: 0,
        })
      }
    })
  }

  const products = [...productsById.values()]
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        (b.product.views || 0) - (a.product.views || 0) ||
        new Date(b.product.createdAt || 0).getTime() -
          new Date(a.product.createdAt || 0).getTime(),
    )
    .slice(0, 50)
    .map(({ product }) => product)

  return { products }
}

const getCachedRelatedProducts = unstable_cache(
  loadRelatedProducts,
  ["related-products-v2"],
  { revalidate: 86_400 },
)

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const payload = await getCachedRelatedProducts(params.id)
    if (!payload) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error(`Error loading related products for ${params.id}:`, error)
    return NextResponse.json(
      { error: "Unable to load related products" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
