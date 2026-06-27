import { NextResponse } from "next/server"
import { categoryConfigs } from "@/config/categories"
import { getDb } from "@/lib/firebase/admin"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
  type PublicProduct,
} from "@/lib/api/public-product"

export const revalidate = 3600

function matchesLine(product: PublicProduct, term: string) {
  const line = (product.line || "").toLowerCase().trim()
  const normalizedTerm = term.toLowerCase().trim()

  return (
    line === normalizedTerm ||
    (line.includes(normalizedTerm) && normalizedTerm.length > 3) ||
    (normalizedTerm.includes(line) && line.length > 3)
  )
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const config = categoryConfigs[params.slug]
  if (!config) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  try {
    const collection = getDb().collection("products")
    const productsById = new Map<string, PublicProduct>()

    if (config.searchType === "line") {
      const terms = [...new Set(config.searchTerms.map((term) => term.trim()).filter(Boolean))]
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
          if (matchesLine(product, term)) {
            productsById.set(product.id, product)
          }
        })
      })
    } else if (config.slug === "plush") {
      const snapshot = await collection
        .where("category", "==", "plush")
        .limit(1000)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get()

      snapshot.forEach((doc) => {
        const product = normalizePublicProduct(doc)
        productsById.set(product.id, product)
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
          (brand.includes("kotobukiya") && !line.includes("nendoroid") && !line.includes("figma")) ||
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

    const products = [...productsById.values()].sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error(`Error loading category ${params.slug}:`, error)
    return NextResponse.json({ error: "Unable to load category" }, { status: 500 })
  }
}
