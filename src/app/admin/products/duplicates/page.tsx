"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/firebase"
import { getAllProductsForSync, deleteProductById, type Product } from "@/lib/firebase/products"
import Link from "next/link"

// ─── SIMILARITY (ESTRICTA: solo duplicados REALES) ────

function norm(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").trim()
}

function tokenize(s: string): string[] {
  const STOP = new Set(["con","del","las","los","para","por","que","the","and","for","with","from","this","that","una","uno","dos","tres","más","muy"])
  return norm(s).split(/\s+/).filter(w => w.length >= 2 && !STOP.has(w))
}

/** Evalúa qué tan similares son dos productos. Solo retorna ≥0.80 si son CASI EL MISMO producto. */
function computeScore(
  normA: string, tokensA: Set<string>,
  normB: string, tokensB: Set<string>,
  brandA: string, brandB: string,
  normLineA: string, normLineB: string,
  heightA: number, heightB: number,
): number {
  // ── Filtros duros previos ──

  // Si tienen línea Y es distinta → no son duplicados
  if (normLineA && normLineB && normLineA !== normLineB) return 0
  // Si tienen marca Y es distinta → probablemente no son duplicados
  if (brandA && brandB && brandA !== brandB) return 0
  // Si tienen altura Y difiere por más de 5cm → no son el mismo producto
  if (heightA > 0 && heightB > 0 && Math.abs(heightA - heightB) > 5) return 0

  // ── Score de nombre ──
  if (normA === normB) return 1.0
  if (normA.includes(normB) || normB.includes(normA)) return 0.95

  // Jaccard: intersección / unión — penaliza si los nombres tienen tokens diferentes
  let inter = 0
  for (const t of tokensA) if (tokensB.has(t)) inter++
  const union = tokensA.size + tokensB.size - inter
  if (union === 0) return 0
  const jaccard = inter / union
  if (jaccard < 0.75) return 0 // si no comparten ≥75% de tokens totales, no son duplicados

  // Bonus por línea/marca idéntica
  const lineBonus = normLineA && normLineB && normLineA === normLineB ? 0.05 : 0
  const brandBonus = brandA && brandB && brandA === brandB ? 0.05 : 0

  return Math.min(1, jaccard + lineBonus + brandBonus)
}

// ─── FORMAT ──────────────────────────────────────────

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—"
  try {
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch {
    return "—"
  }
}

// ─── PRE-COMPUTED ────────────────────────────────────

interface ProductData {
  normName: string
  tokens: Set<string>
  brand: string
  normBrand: string
  line: string
  normLine: string
  price: number
  height: number
  product: Product
}

function preCompute(allProducts: Product[]): ProductData[] {
  return allProducts.map(p => ({
    normName: norm(p.name),
    tokens: new Set(norm(p.name).split(/\s+/).filter(t => t.length > 0)),
    brand: p.brand || "",
    normBrand: norm(p.brand || ""),
    line: p.line || "",
    normLine: norm(p.line || ""),
    price: p.price,
    height: p.heightCm || 0,
    product: p,
  }))
}

// ─── FIND DUPLICATES ─────────────────────────────────

interface MatchGroup {
  products: Product[]
  score: number
}

const MIN_SCORE = 0.90
const MAX_GROUP_SIZE = 3

async function findAllGroups(data: ProductData[], onProgress?: (label: string) => void): Promise<MatchGroup[]> {
  const n = data.length

  // 1. Indexar por línea (primario) y marca (secundario para productos sin línea)
  onProgress?.("Indexando productos por línea y marca...")
  await new Promise(r => setTimeout(r, 0))

  const lineIndex = new Map<string, number[]>()
  const brandIndex = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    const p = data[i]
    if (p.line) {
      const list = lineIndex.get(p.line)
      if (list) list.push(i)
      else lineIndex.set(p.line, [i])
    } else if (p.brand) {
      const list = brandIndex.get(p.brand)
      if (list) list.push(i)
      else brandIndex.set(p.brand, [i])
    }
  }

  // 2. Union-Find
  const parent: number[] = Array.from({ length: n }, (_, i) => i)
  const rank: number[] = new Array(n).fill(0)
  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] }
    return x
  }
  function union(x: number, y: number) {
    const rx = find(x), ry = find(y)
    if (rx === ry) return
    if (rank[rx] < rank[ry]) parent[rx] = ry
    else if (rank[rx] > rank[ry]) parent[ry] = rx
    else { parent[ry] = rx; rank[rx]++ }
  }

  const bestScore = new Map<string, number>()

  // 3. Comparar dentro de cada línea (ahí están los duplicados reales)
  const lineEntries = [...lineIndex.entries()]
  for (let li = 0; li < lineEntries.length; li++) {
    const [line, indices] = lineEntries[li]
    if (indices.length < 2) continue

    if (li % 20 === 0) {
      onProgress?.(`Línea ${li + 1}/${lineEntries.length}: "${line}" (${indices.length} productos)`)
      await new Promise(r => setTimeout(r, 0))
    }

    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a], j = indices[b]
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (bestScore.has(key)) continue

        const da = data[i], db = data[j]
        const score = computeScore(
          da.normName, da.tokens, db.normName, db.tokens,
          da.normBrand, db.normBrand, da.normLine, db.normLine,
          da.height, db.height,
        )
        if (score >= MIN_SCORE) {
          bestScore.set(key, score)
          union(i, j)
        }
      }
    }
  }

  // 4. Comparar dentro de cada marca (productos sin línea pero misma marca)
  onProgress?.("Revisando productos sin línea (por marca)...")
  await new Promise(r => setTimeout(r, 0))

  for (const [, indices] of brandIndex) {
    if (indices.length < 2) continue
    // Solo comparar pares que NO estén ya unidos por línea
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a], j = indices[b]
        if (find(i) === find(j)) continue // ya unidos por línea
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (bestScore.has(key)) continue

        const da = data[i], db = data[j]
        const score = computeScore(
          da.normName, da.tokens, db.normName, db.tokens,
          da.normBrand, db.normBrand, da.normLine, db.normLine,
          da.height, db.height,
        )
        if (score >= MIN_SCORE) {
          bestScore.set(key, score)
          union(i, j)
        }
      }
    }
  }

  onProgress?.("Agrupando resultados...")
  await new Promise(r => setTimeout(r, 0))

  // 5. Agrupar por root, limitar a MAX_GROUP_SIZE por grupo
  const groupMap = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    const list = groupMap.get(r)
    if (list) {
      if (list.length < MAX_GROUP_SIZE) list.push(i)
    } else {
      groupMap.set(r, [i])
    }
  }

  // 6. Convertir a MatchGroup
  const groups: MatchGroup[] = []
  for (const [, indices] of groupMap) {
    if (indices.length < 2) continue
    let maxScore = 0
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const key = indices[a] < indices[b] ? `${indices[a]}-${indices[b]}` : `${indices[b]}-${indices[a]}`
        const sc = bestScore.get(key)
        if (sc !== undefined && sc > maxScore) maxScore = sc
      }
    }
    groups.push({
      products: indices.map(i => data[i].product),
      score: maxScore,
    })
  }

  groups.sort((a, b) => b.score - a.score)
  return groups
}

// ─── PAGE ───────────────────────────────────────────

export default function DuplicatesPage() {
  const router = useRouter()
  const [user, loading] = useAuthState(auth)

  const [phase, setPhase] = useState<"idle" | "loading" | "analyzing" | "done">("idle")
  const [groups, setGroups] = useState<MatchGroup[]>([])
  const [visibleCount, setVisibleCount] = useState(3)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  const [progressLabel, setProgressLabel] = useState("")
  const cancelRef = useRef(false)

  useEffect(() => {
    return () => { cancelRef.current = true }
  }, [])

  const scanAll = useCallback(async () => {
    cancelRef.current = false
    setPhase("loading")
    setGroups([])
    setVisibleCount(3)
    setProgressLabel("Cargando catálogo... (~5-10s la primera vez)")

    try {
      const t0 = performance.now()
      const products = await getAllProductsForSync(false)
      if (cancelRef.current) return
      const t1 = performance.now()

      setProgressLabel(`✅ ${products.length} productos (${((t1 - t0) / 1000).toFixed(1)}s). Indexando...`)
      await new Promise(r => setTimeout(r, 10))

      const data = preCompute(products)
      if (cancelRef.current) return

      setPhase("analyzing")
      const t2 = performance.now()
      const allGroups = await findAllGroups(data, (label) => {
        if (!cancelRef.current) setProgressLabel(label)
      })
      if (cancelRef.current) return
      const t3 = performance.now()

      setGroups(allGroups)
      setProgressLabel(
        `✅ ${products.length} productos · ${allGroups.length} grupos (≥80%) · ` +
        `carga ${((t1 - t0) / 1000).toFixed(1)}s · análisis ${((t3 - t2) / 1000).toFixed(1)}s`
      )
      setPhase("done")
    } catch (err) {
      console.error("Error:", err)
      setProgressLabel("❌ Error al cargar. Intenta de nuevo.")
      setPhase("done")
    }
  }, [])

  useEffect(() => {
    if (!user) return
    scanAll()
  }, [user])

  // ─── DELETE ──────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return
    setDeleting(id)
    setDeletedIds(prev => new Set(prev).add(id))
    deleteProductById(id)
      .catch(() => { alert("❌ Error al eliminar"); setDeletedIds(prev => { const n = new Set(prev); n.delete(id); return n }) })
      .finally(() => setDeleting(null))
  }
  const handleKeep = (id: string) => setDeletedIds(prev => new Set(prev).add(id))
  const handleUndoDelete = (id: string) => {
    setDeletedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  // ─── VISIBLE ─────────────────────────────────────
  const validGroups = groups
    .map(g => ({ ...g, products: g.products.filter(p => !deletedIds.has(p.id)) }))
    .filter(g => g.products.length >= 2)

  const showGroups = validGroups.slice(0, visibleCount)
  const hasMoreGroups = visibleCount < validGroups.length
  const totalDeleted = deletedIds.size
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMoreGroups) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => prev + 3) },
      { rootMargin: "200px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMoreGroups])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Cargando...</div></div>
  if (!user) { router.push("/login"); return null }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🔍 Duplicados</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {phase === "loading" && "⏳ Cargando catálogo..."}
              {phase === "analyzing" && "🔎 Buscando duplicados (≥80% de similitud)..."}
              {phase === "done" && (
                <>{validGroups.length} grupos encontrados · max {MAX_GROUP_SIZE} por grupo{totalDeleted > 0 && ` · ${totalDeleted} descartado${totalDeleted !== 1 ? "s" : ""}`}</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={scanAll} disabled={phase === "loading" || phase === "analyzing"}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium text-sm">
              ↻ Re-analizar
            </button>
            <Link href="/admin/products"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-sm">← Volver</Link>
          </div>
        </div>

        {/* PROGRESS */}
        {(phase === "loading" || phase === "analyzing") && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-300 font-medium">{progressLabel}</p>
                {phase === "loading" && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Las siguientes cargas serán instantáneas (caché de 30 min)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SUMMARY */}
        {phase === "done" && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 text-sm text-gray-600 dark:text-gray-400">
            {progressLabel}
          </div>
        )}

        {/* NO RESULTS */}
        {phase === "done" && validGroups.length === 0 && (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
            <div className="text-7xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No hay duplicados</h3>
            <p className="text-gray-500 dark:text-gray-400">No se encontraron productos con similitud ≥ {Math.round(MIN_SCORE * 100)}% (misma línea o marca, nombre casi idéntico).</p>
          </div>
        )}

        {/* GROUPS */}
        {showGroups.map((group, gi) => (
          <div key={gi} className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 overflow-hidden border border-red-200 dark:border-red-900">
            <div className="px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 flex items-center justify-between border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">#{gi + 1}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{group.products.length} productos</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{Math.round(group.score * 100)}%</span>
              </div>
              <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                {group.products[0].line && <span>📋 {group.products[0].line}</span>}
                {group.products[0].brand && <span>🏭 {group.products[0].brand}</span>}
              </div>
            </div>
            <div className="divide-y dark:divide-gray-700/50">
              {group.products.map((product, pi) => {
                const isDeleted = deletedIds.has(product.id)
                return (
                  <div key={product.id} className={`flex items-center gap-3 p-3 transition-all ${isDeleted ? "opacity-40 line-through" : "hover:bg-gray-50 dark:hover:bg-gray-750"}`}>
                    <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate leading-tight">{product.name}</h4>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">S/. {product.price.toFixed(2)}</span>
                        {product.brand && <span>🏭 {product.brand}</span>}
                        {product.line && <span>📋 {product.line}</span>}
                        {product.heightCm && <span>📏 {product.heightCm}cm</span>}
                        <span>📅 {formatDate(product.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Link href={`/admin/products/edit/${product.id}`} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium">✏️</Link>
                      {isDeleted ? (
                        <button onClick={() => handleUndoDelete(product.id)} className="px-2 py-1 bg-gray-400 dark:bg-gray-500 text-white rounded hover:bg-gray-500 text-xs font-medium">↩️</button>
                      ) : (
                        <>
                          <button onClick={() => handleKeep(product.id)} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium">✅</button>
                          <button onClick={() => handleDelete(product.id)} disabled={deleting === product.id} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-xs font-medium">
                            {deleting === product.id ? "..." : "🗑️"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ACTIONS */}
        <div className="flex flex-col items-center gap-3 py-6">
          {phase === "done" && validGroups.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {validGroups.length} grupo{validGroups.length !== 1 ? "s" : ""} · ≥{Math.round(MIN_SCORE * 100)}% · máx {MAX_GROUP_SIZE} por grupo
              {totalDeleted > 0 && ` · ${totalDeleted} descartado${totalDeleted !== 1 ? "s" : ""}`}
              {hasMoreGroups && ` · mostrando ${visibleCount}/${validGroups.length}`}
            </p>
          )}
          {/* Sentinel para infinite scroll */}
          {hasMoreGroups && <div ref={sentinelRef} className="h-4 w-full" />}
        </div>
      </div>
    </div>
  )
}
