import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import generatedIndex from "@/lib/search/generated-index.json"
import type { CompactSearchIndexEntry } from "@/lib/search/index-types"
import { expandImageUrl } from "@/lib/search/image-url"

export const dynamic = "force-dynamic"

// ─── SIMILARITY ENGINE (same as client, but runs on server) ────────

function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function getWords(text: string): string[] {
  const STOP_WORDS = new Set([
    "con", "del", "las", "los", "para", "por", "que",
    "the", "and", "for", "with", "from", "this", "that",
  ])
  return normalize(text)
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
}

function computeScore(
  aName: string, aBrand: string | undefined, aPrice: number,
  bName: string, bBrand: string | undefined, bPrice: number,
): number {
  const normA = normalize(aName)
  const normB = normalize(bName)
  if (normA === normB) return 1.0

  const tokensA = new Set(normA.split(/\s+/).filter(t => t.length > 1))
  const tokensB = new Set(normB.split(/\s+/).filter(t => t.length > 1))

  let intersection = 0
  for (const t of tokensA) if (tokensB.has(t)) intersection++
  const union = tokensA.size + tokensB.size - intersection
  const nameScore = union === 0 ? 0 : intersection / union
  const containment = (normA.includes(normB) || normB.includes(normA)) ? 0.30 : 0
  const brand = aBrand && bBrand && normalize(aBrand) === normalize(bBrand) ? 0.20 : 0

  const maxP = Math.max(aPrice, bPrice)
  const minP = Math.min(aPrice, bPrice)
  let price = 0
  if (maxP > 0) {
    const ratio = minP / maxP
    if (ratio > 0.9) price = 0.10
    else if (ratio > 0.7) price = 0.05
  }

  return Math.max(0, Math.min(1, nameScore + containment + brand + price))
}

// ─── DTO for response ────────────────────────────

interface ProductBrief {
  id: string
  name: string
  price: number
  brand?: string
  thumbnail?: string
}

interface GroupDTO {
  score: number
  products: ProductBrief[]
}

// ─── API ROUTE ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request)
    if (!adminAuth.ok) return adminAuth.response

    const startTime = Date.now()

    const products = (generatedIndex as CompactSearchIndexEntry[]).map((entry) => ({
      id: entry[0],
      name: entry[1] || "",
      price: entry[3] || 0,
      brand: entry[6] || undefined,
      thumbnail: expandImageUrl(entry[5] || entry[4]) || undefined,
    }))

    console.log(`📦 ${products.length} productos cargados en ${Date.now() - startTime}ms`)

    // 2. Build inverted index
    const n = products.length
    const productWords = products.map(p => [...new Set(getWords(p.name))])

    const invertedIndex = new Map<string, number[]>()
    for (let i = 0; i < n; i++) {
      for (const word of productWords[i]) {
        if (!invertedIndex.has(word)) invertedIndex.set(word, [])
        invertedIndex.get(word)!.push(i)
      }
    }

    // Also index by brand
    const brandIndex = new Map<string, number[]>()
    for (let i = 0; i < n; i++) {
      const b = products[i].brand
      if (b) {
        const nb = normalize(b)
        if (!brandIndex.has(nb)) brandIndex.set(nb, [])
        brandIndex.get(nb)!.push(i)
      }
    }

    // 3. Generate candidate pairs
    const candidateSet = new Set<string>()
    const pairs: { i: number; j: number; score: number }[] = []
    const MIN_SCORE = 0.15

    for (let i = 0; i < n; i++) {
      // By shared words
      for (const word of productWords[i]) {
        const candidates = invertedIndex.get(word)
        if (!candidates) continue
        for (const j of candidates) {
          if (j <= i) continue
          const key = `${i},${j}`
          if (candidateSet.has(key)) continue
          candidateSet.add(key)
          const s = computeScore(
            products[i].name, products[i].brand, products[i].price,
            products[j].name, products[j].brand, products[j].price,
          )
          if (s >= MIN_SCORE) pairs.push({ i, j, score: s })
        }
      }

      // By same brand
      const b = products[i].brand
      if (b) {
        const nb = normalize(b)
        const sameBrand = brandIndex.get(nb)
        if (sameBrand) {
          for (const j of sameBrand) {
            if (j <= i) continue
            const key = `${i},${j}`
            if (candidateSet.has(key)) continue
            candidateSet.add(key)
            const s = computeScore(
              products[i].name, products[i].brand, products[i].price,
              products[j].name, products[j].brand, products[j].price,
            )
            if (s >= MIN_SCORE) pairs.push({ i, j, score: s })
          }
        }
      }
    }

    console.log(`🔗 ${pairs.length} pares candidatos encontrados`)

    // 4. Graph clustering
    pairs.sort((a, b) => b.score - a.score)

    const groups: GroupDTO[] = []
    for (const pair of pairs) {
      let found: GroupDTO | null = null
      for (const g of groups) {
        if (g.products.some(p => p.id === products[pair.i].id || p.id === products[pair.j].id)) {
          found = g; break
        }
      }
      if (found) {
        const ids = new Set(found.products.map(p => p.id))
        if (!ids.has(products[pair.i].id))
          found.products.push({ id: products[pair.i].id, name: products[pair.i].name, price: products[pair.i].price, brand: products[pair.i].brand, thumbnail: products[pair.i].thumbnail })
        if (!ids.has(products[pair.j].id))
          found.products.push({ id: products[pair.j].id, name: products[pair.j].name, price: products[pair.j].price, brand: products[pair.j].brand, thumbnail: products[pair.j].thumbnail })
      } else {
        groups.push({
          score: pair.score,
          products: [
            { id: products[pair.i].id, name: products[pair.i].name, price: products[pair.i].price, brand: products[pair.i].brand, thumbnail: products[pair.i].thumbnail },
            { id: products[pair.j].id, name: products[pair.j].name, price: products[pair.j].price, brand: products[pair.j].brand, thumbnail: products[pair.j].thumbnail },
          ],
        })
      }
    }

    groups.sort((a, b) => b.score - a.score)

    const elapsed = Date.now() - startTime
    console.log(`✅ ${groups.length} grupos encontrados en ${elapsed}ms`)

    return NextResponse.json({
      totalProducts: n,
      totalGroups: groups.length,
      groups,
      elapsedMs: elapsed,
    })
  } catch (error) {
    console.error("❌ Error en /api/duplicates:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}
