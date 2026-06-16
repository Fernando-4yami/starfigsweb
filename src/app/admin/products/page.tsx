"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/auth-client"
import { getProductsPaginated, searchProducts, deleteProductById, type Product } from "@/lib/firebase/products"
import { type DocumentSnapshot } from "firebase/firestore"
import Link from "next/link"
import ImageGenerator from "@/components/ImageGenerator"
import ImageGeneratorBatch, { type ImageGeneratorBatchHandle } from "@/components/ImageGeneratorBatch"
import JSZip from "jszip"
import { useState as useGlobalState } from "react"

// ========== BATCH STORAGE ==========
const BATCH_STORAGE_KEY = 'starfigs-batch-products'

function loadBatchFromStorage(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(BATCH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}
function saveBatchToStorage(products: Product[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(products)) } catch {}
}
const batchProducts: Product[] = loadBatchFromStorage()
const batchListeners: Set<() => void> = new Set()
function addToBatch(product: Product) {
  if (!batchProducts.find(p => p.id === product.id)) {
    batchProducts.push(product); saveBatchToStorage(batchProducts); batchListeners.forEach(l => l())
  }
}
function removeFromBatch(productId: string) {
  const i = batchProducts.findIndex(p => p.id === productId)
  if (i !== -1) { batchProducts.splice(i, 1); saveBatchToStorage(batchProducts); batchListeners.forEach(l => l()) }
}
function clearBatch() {
  batchProducts.length = 0; saveBatchToStorage(batchProducts); batchListeners.forEach(l => l())
}
function useBatchState() {
  const [, forceUpdate] = useGlobalState({})
  useEffect(() => {
    const listener = () => forceUpdate({})
    batchListeners.add(listener)
    return () => { batchListeners.delete(listener) }
  }, [])
  return { products: batchProducts, addToBatch, removeFromBatch, clearBatch }
}

type SortBy = "name" | "price" | "createdAt" | "views"
type SortOrder = "asc" | "desc"

const generateProductTemplate = (product: Product): string => {
  const baseUrl = "https://starfigsperu.com"
  const productUrl = `${baseUrl}/products/${product.slug || product.id}`
  return `🔖 ${product.name}\nPrecio: s/${(product.price || 0).toFixed(2)}\nReserva min: s/40.00\n🌟 Mas detalles: ${productUrl}`
}

const formatDateDDMMYYYY = (date: Date | null | undefined): string => {
  if (!date) return "Por confirmar"
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return "Por confirmar"
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const calculateReserva = (price: number): number => {
  if (price > 200) {
    // 50% redondeado hacia arriba
    return Math.ceil(price * 0.5)
  }
  return 40
}

const generateFacebookPostTemplate = (product: Product): string => {
  const baseUrl = "https://starfigsperu.com"
  const productUrl = `${baseUrl}/products/${product.slug || product.id}`
  const releaseDateFormatted = formatDateDDMMYYYY(product.releaseDate)
  const price = product.price || 0
  const reserva = calculateReserva(price)

  return [
    "⭐ PREVENTA / BAJO PEDIDO",
    "",
    `🔹 ${product.name}`,
    "",
    `💰 Precio: S/${price.toFixed(2)}`,
    `💸 Reserva: S/${reserva} para separar`,
    `🗓️ Lanzamiento: ${releaseDateFormatted}`,
    "",
    "🌟 Más detalles:",
    productUrl,
    "",
    "🎁 Envío gratis por Shalom a agencia como beneficio de preventa",
    `🚢 Llegada a Perú: aprox. 2-3 meses luego del lanzamiento`,
    "📌 Incluye importación completa: impuestos, aduanas, seguro y envío Japón → Perú",
    "",
    "🚚 Envíos a todo el Perú (Shalom / Olva Courier)",
    "💳 Pagos yape o transferencia",
    "",
    "🇯🇵✨ Producto ORIGINAL y SELLADO",
  ].join("\n")
}
const mimeToExt: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
}

const downloadProductImages = async (imageUrls: string[], productName: string): Promise<number> => {
  if (!imageUrls || imageUrls.length === 0) {
    alert("❌ Este producto no tiene imágenes")
    return 0
  }
  const zip = new JSZip()
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "producto"
  let successCount = 0

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const resp = await fetch(imageUrls[i])
      const blob = await resp.blob()
      const ext = mimeToExt[blob.type] || "jpg"
      zip.file(`${slug}_${i + 1}.${ext}`, blob)
      successCount++
    } catch (err) {
      console.error(`Error descargando imagen ${i + 1}:`, err)
    }
  }

  if (successCount === 0) {
    alert("❌ No se pudo descargar ninguna imagen")
    return 0
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(zipBlob)
  link.download = `${slug}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
  return successCount
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try { await navigator.clipboard.writeText(text); return true }
  catch {
    const ta = document.createElement("textarea"); ta.value = text
    ta.style.position = "fixed"; ta.style.left = "-999999px"
    document.body.appendChild(ta); ta.focus(); ta.select()
    try { document.execCommand("copy"); document.body.removeChild(ta); return true }
    catch { document.body.removeChild(ta); return false }
  }
}
function strictSearchFilter(products: Product[], query: string): Product[] {
  if (!query.trim()) return products
  const terms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
  return products.filter(p => {
    const text = [p.name, p.brand, p.line, p.category, p.scale, p.description].filter(Boolean).join(" ").toLowerCase()
    return terms.every(t => text.includes(t))
  })
}
function sortByRelevance(products: Product[], query: string): Product[] {
  if (!query.trim()) return products
  const terms = query.toLowerCase().trim().split(/\s+/)
  return [...products].sort((a, b) => {
    let sA = 0, sB = 0
    const tA = a.name.toLowerCase(), tB = b.name.toLowerCase()
    terms.forEach(t => {
      if (tA.includes(t)) { if (tA.startsWith(t)) sA += 10; sA += 1 }
      if (tB.includes(t)) { if (tB.startsWith(t)) sB += 10; sB += 1 }
    })
    return sB - sA
  })
}

export default function ProductsPage() {
  const router = useRouter()
  const [user, loading] = useAuthState(auth)

  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [priceFilter, setPriceFilter] = useState<"all" | "low" | "mid" | "high">("all")
  const [sortBy, setSortBy] = useState<SortBy>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { addToBatch } = useBatchState()

  const toggleSelectProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredProducts.map(p => p.id)))
  }
  const deselectAll = () => {
    setSelectedIds(new Set())
  }
  const addSelectedToBatch = () => {
    filteredProducts.filter(p => selectedIds.has(p.id)).forEach(p => addToBatch(p))
    setSelectedIds(new Set())
  }

  // cursor es un DocumentSnapshot para paginación Firestore
  const cursorRef = useRef<DocumentSnapshot | null>(null)
  const isFetchingRef = useRef(false)
  const hasMoreRef = useRef(true)

  // ===================== LOAD PRODUCTS =====================
  const loadProducts = useCallback(async (reset = false, silent = false) => {
    if (!user) return
    if (isFetchingRef.current) {
      console.log("⏳ Ya está cargando, ignorando llamada")
      return
    }
    if (!reset && !hasMoreRef.current) {
      console.log("🚫 No hay más productos")
      return
    }

    isFetchingRef.current = true
    if (!silent) setProductsLoading(true)

    try {
      if (searchTerm.trim()) {
        const results = await searchProducts(searchTerm)
        const filtered = strictSearchFilter(results, searchTerm)
        const sorted = sortByRelevance(filtered, searchTerm)
        setProducts(sorted)
        setHasMore(false)
        hasMoreRef.current = false
        cursorRef.current = null
      } else {
        // cursor numérico: null = desde el inicio, número = índice siguiente
        const cursor = reset ? null : cursorRef.current

        console.log(`📦 loadProducts | reset=${reset} | cursor=${cursor}`)

        const { products: newProds, lastDoc: nextCursor, hasMore: more } =
          await getProductsPaginated(50, cursor)

        console.log(`✅ Recibidos: ${newProds.length} | nextCursor: ${nextCursor} | hasMore: ${more}`)

        // Guardar cursor para la siguiente página
        cursorRef.current = nextCursor as DocumentSnapshot | null
        hasMoreRef.current = more

        if (reset) {
          setProducts(newProds)
        } else {
          setProducts(prev => {
            const ids = new Set(prev.map(p => p.id))
            const fresh = newProds.filter(p => !ids.has(p.id))
            console.log(`➕ ${fresh.length} nuevos | ${newProds.length - fresh.length} duplicados ignorados`)
            return [...prev, ...fresh]
          })
        }

        setHasMore(more)
      }
    } catch (err) {
      console.error("Error loading products:", err)
    } finally {
      if (!silent) setProductsLoading(false)
      isFetchingRef.current = false
    }
  }, [user, searchTerm])

  // Carga inicial
  useEffect(() => {
    if (!user) return
    cursorRef.current = null
    hasMoreRef.current = true
    setHasMore(true)
    setProducts([])
    loadProducts(true)
  }, [user])

  // Re-buscar cuando cambia searchTerm
  useEffect(() => {
    if (!user) return
    cursorRef.current = null
    hasMoreRef.current = true
    setHasMore(true)
    const t = setTimeout(() => loadProducts(true), 300)
    return () => clearTimeout(t)
  }, [searchTerm, user])

  // ===================== INFINITE SCROLL =====================
  useEffect(() => {
    const onScroll = () => {
      if (isFetchingRef.current) return
      if (!hasMoreRef.current) return
      if (searchTerm.trim()) return

      const distFromBottom =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight

      if (distFromBottom < 600) {
        console.log(`📜 Scroll trigger | dist: ${Math.round(distFromBottom)}px | cursor: ${cursorRef.current}`)
        loadProducts(false)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [loadProducts, searchTerm])

  const refreshProducts = useCallback(() => {
    cursorRef.current = null
    hasMoreRef.current = true
    setHasMore(true)
    setProducts([])
    loadProducts(true)
  }, [loadProducts])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return
    setDeleting(id)
    try { await deleteProductById(id); setProducts(prev => prev.filter(p => p.id !== id)) }
    catch { alert("Error al eliminar") }
    finally { setDeleting(null) }
  }
  const handleCopyTemplate = async (product: Product) => {
    const ok = await copyToClipboard(generateProductTemplate(product))
    if (ok) alert("📋 Plantilla copiada")
  }
  const handleCopyFacebookTemplate = async (product: Product) => {
    const ok = await copyToClipboard(generateFacebookPostTemplate(product))
    if (ok) alert("📋 Plantilla Facebook copiada")
  }

  const brands = useMemo(() => {
    const s = new Set<string>(); products.forEach(p => { if (p.brand) s.add(p.brand) }); return Array.from(s).sort()
  }, [products])
  const categories = useMemo(() => {
    const s = new Set<string>(); products.forEach(p => { if (p.category) s.add(p.category) }); return Array.from(s).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    let f = [...products]
    if (searchTerm.trim()) { f = strictSearchFilter(f, searchTerm); f = sortByRelevance(f, searchTerm) }
    if (selectedBrand) f = f.filter(p => p.brand === selectedBrand)
    if (selectedCategory) f = f.filter(p => p.category === selectedCategory)
    if (priceFilter !== "all") f = f.filter(p => {
      const price = p.price || 0
      if (priceFilter === "low") return price < 100
      if (priceFilter === "mid") return price >= 100 && price < 200
      return price >= 200
    })
    if (!searchTerm.trim()) {
      f.sort((a, b) => {
        let vA: any = a[sortBy], vB: any = b[sortBy]
        if (sortBy === "createdAt") { vA = vA ? new Date(vA).getTime() : 0; vB = vB ? new Date(vB).getTime() : 0 }
        if (typeof vA === "string") vA = vA.toLowerCase()
        if (typeof vB === "string") vB = vB.toLowerCase()
        if (vA < vB) return sortOrder === "asc" ? -1 : 1
        if (vA > vB) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    }
    return f
  }, [products, searchTerm, selectedBrand, selectedCategory, priceFilter, sortBy, sortOrder])

  // Limpiar selección al cambiar filtros
  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchTerm, selectedBrand, selectedCategory, priceFilter])

  const clearFilters = () => {
    setSearchTerm(""); setSelectedBrand(""); setSelectedCategory("")
    setPriceFilter("all"); setSortBy("createdAt"); setSortOrder("desc")
  }
  const hasActiveFilters = !!(searchTerm || selectedBrand || selectedCategory || priceFilter !== "all")

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Cargando...</div></div>
  if (!user) { router.push("/login"); return null }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📦 Productos</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {products.length} productos cargados
              {hasMore && <span className="text-blue-500 dark:text-blue-400"> · hay más</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/products/duplicates" className="bg-orange-500 dark:bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-600 dark:hover:bg-orange-700 font-medium text-sm flex items-center gap-1.5">
              🔍 Duplicados
            </Link>
            <Link href="/admin/products/add" className="bg-blue-500 dark:bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 font-medium">
              ➕ Nuevo Producto
            </Link>
          </div>
        </div>

        <BatchActionBar
          selectedCount={selectedIds.size}
          totalFiltered={filteredProducts.length}
          onSelectAll={selectAllFiltered}
          onDeselectAll={deselectAll}
          onAddToBatch={addSelectedToBatch}
        />

        <FilterBar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand}
          selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          priceFilter={priceFilter} setPriceFilter={setPriceFilter}
          sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder}
          brands={brands} categories={categories}
          onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters}
          onRefresh={refreshProducts} isLoading={productsLoading}
        />

        {productsLoading && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No se encontraron productos</h3>
            <button onClick={clearFilters} className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onDelete={handleDelete} deleting={deleting === product.id} onCopyTemplate={handleCopyTemplate} onCopyFacebookTemplate={handleCopyFacebookTemplate} isSelected={selectedIds.has(product.id)} onToggleSelect={toggleSelectProduct} />
              ))}
            </div>

            <div className="h-20 mt-8 flex items-center justify-center">
              {productsLoading && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Cargando más productos...</span>
                </div>
              )}
              {!hasMore && !productsLoading && products.length > 0 && (
                <span className="text-gray-400 dark:text-gray-500 text-sm">— {products.length} productos cargados —</span>
              )}
            </div>
          </>
        )}
      </div>
      <BatchGeneratorModal />
    </div>
  )
}

/* ================= BATCH MODAL ================= */
function BatchGeneratorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingVersion, setGeneratingVersion] = useState<1 | 2 | 3>(1)
  const { products: batchProds } = useBatchState()
  const batchRefs = useRef<Record<string, ImageGeneratorBatchHandle | null>>({})
  const getBatchRefCallback = useCallback((productId: string) => (handle: ImageGeneratorBatchHandle | null) => {
    batchRefs.current[productId] = handle
  }, [])

  const generateAll = async (version: 1 | 2 | 3) => {
    if (!confirm(`¿Generar versión ${version} de todos los ${batchProds.length} productos?`)) return
    setGeneratingAll(true)

    const zip = new JSZip()
    const versionName = version === 1 ? "single" : version === 2 ? "triple-123" : "triple-234"
    const results: { name: string; dataUrl: string }[] = []

    for (const product of batchProds) {
      try {
        const handle = batchRefs.current[product.id]
        if (handle) {
          const dataUrl = await handle.generatePng(version)
          results.push({ name: product.name, dataUrl })
        }
      } catch (err) {
        console.error(`Error generando ${product.name}:`, err)
      }
    }

    // Agregar todas las imágenes al ZIP con números secuenciales (1, 2, 3...)
    results.forEach((result, idx) => {
      const base64 = result.dataUrl.split(",")[1]
      const num = String(idx + 1).padStart(2, "0")
      zip.file(`${num}-v${version}-${versionName}.png`, base64, { base64: true })
    })

    // Descargar ZIP único
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(zipBlob)
    link.download = `starfigs-v${version}-${versionName}.zip`
    link.click()
    URL.revokeObjectURL(link.href)

    setGeneratingAll(false)
    if (results.length === 0) {
      alert("❌ No se pudo generar ninguna imagen. Revisa la consola para más detalles.")
    } else {
      alert(`✅ ${results.length} imágenes generadas y descargadas en un solo ZIP`)
    }
  }

  if (!isOpen && batchProds.length === 0) return null
  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg z-50 font-bold animate-bounce">
      📦 Lote ({batchProds.length})
    </button>
  )

  return (              <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">📦 Generador por Lotes</h2>
            <p className="text-sm opacity-90">{batchProds.length} productos seleccionados</p>
          </div>
          <div className="flex gap-2">
            {batchProds.length > 0 && (<>
              <div className="flex gap-2 items-center bg-white bg-opacity-20 rounded px-3">
                <span className="text-sm font-medium">Versión:</span>
                <select value={generatingVersion} onChange={e => setGeneratingVersion(Number(e.target.value) as 1|2|3)}
                  className="bg-white bg-opacity-30 text-white rounded px-2 py-1 text-sm font-bold border-0" disabled={generatingAll}>
                  <option value={1}>1️⃣ Única</option>
                  <option value={2}>2️⃣ Triple (1,2,3)</option>
                  <option value={3}>3️⃣ Triple (2,3,4)</option>
                </select>
              </div>
              <button onClick={() => generateAll(generatingVersion)} disabled={generatingAll} className="px-4 py-2 bg-green-500 bg-opacity-90 rounded font-bold disabled:opacity-50">
                {generatingAll ? "⏳ Generando..." : `⚡ Generar Todos`}
              </button>
              <button onClick={clearBatch} className="px-4 py-2 bg-white bg-opacity-20 rounded">🗑️ Limpiar</button>
            </>)}
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-white bg-opacity-20 rounded">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {batchProds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No hay productos seleccionados</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {batchProds.map(product => (
                <div key={product.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex gap-4 items-start" data-product-id={product.id}>
                  <div className="w-20 h-20 flex-shrink-0">
                    <img src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover rounded" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm">{product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">S/. {product.price.toFixed(2)}</p>
                    {product.brand && <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>}
                  </div>
                  <div className="flex-shrink-0 w-[340px]">
                    <ImageGeneratorBatch
                      ref={getBatchRefCallback(product.id)}
                      productName={product.name} productPrice={product.price} productBrand={product.brand}
                      imageUrl={product.imageUrls?.[0]} imageUrls={product.imageUrls}
                      onRemove={() => removeFromBatch(product.id)} productId={product.id} productSlug={product.slug}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            💡 <strong>Preview:</strong> Click 1, 2, 3 | <strong>Generar:</strong> 1️⃣ 2️⃣ 3️⃣ | <strong>Plantilla:</strong> 📋
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================= COMPONENTES ================= */
function FilterBar({ searchTerm, setSearchTerm, selectedBrand, setSelectedBrand, selectedCategory, setSelectedCategory, priceFilter, setPriceFilter, sortBy, setSortBy, sortOrder, setSortOrder, brands, categories, onClearFilters, hasActiveFilters, onRefresh, isLoading }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="🔍 Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
        <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">Todas las marcas</option>
          {brands.map((b: string) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">Todas las categorías</option>
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="all">Todos los precios</option>
          <option value="low">&lt; S/. 100</option>
          <option value="mid">S/. 100 - 200</option>
          <option value="high">&gt; S/. 200</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="px-3 py-1 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <option value="name">Nombre</option><option value="price">Precio</option>
            <option value="createdAt">Fecha</option><option value="views">Vistas</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm">
            {sortOrder === "asc" ? "↑ A-Z" : "↓ Z-A"}
          </button>
        </div>
        {hasActiveFilters && <button onClick={onClearFilters} className="px-4 py-1 bg-red-500 dark:bg-red-600 text-white rounded-lg text-sm">Limpiar filtros</button>}
        <button onClick={onRefresh} disabled={isLoading} className="ml-auto px-4 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg disabled:opacity-50 text-sm">
          {isLoading ? "⏳" : "🔄"} Actualizar
        </button>
      </div>
    </div>
  )
}

function ProductCard({ product, onDelete, deleting, onCopyTemplate, onCopyFacebookTemplate, isSelected, onToggleSelect }: any) {
  const [showImageGen, setShowImageGen] = useState(false)
  const [downloadingImgs, setDownloadingImgs] = useState(false)

  const handleDownloadImages = async () => {
    setDownloadingImgs(true)
    const count = await downloadProductImages(product.imageUrls || [], product.name)
    setDownloadingImgs(false)
    if (count > 0) {
      alert(`✅ ${count} imágenes descargadas`)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all overflow-hidden flex flex-col ${isSelected ? "ring-2 ring-pink-500 dark:ring-pink-400" : ""}`}>
      <div className="h-52 relative bg-gray-100 dark:bg-gray-700 shrink-0 overflow-hidden group">
        <img src={product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
        {/* Checkbox de selección - esquina derecha */}
        <button
          type="button"
          onClick={() => onToggleSelect(product.id)}
          className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-md ${
            isSelected
              ? "bg-pink-500 text-white shadow-lg scale-110 ring-2 ring-white dark:ring-gray-900"
              : "bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100"
          }`}
          aria-label={isSelected ? "Deseleccionar" : "Seleccionar"}
        >
          {isSelected ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        {isSelected && (
          <div className="absolute inset-0 bg-pink-500/10 dark:bg-pink-500/20 pointer-events-none" />
        )}
        {(product.views ?? 0) > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            👁️ {product.views}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-start gap-1.5 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm flex-1 min-w-0">{product.name}</h3>
            <button
              onClick={() => onCopyFacebookTemplate(product)}
              className="shrink-0 bg-blue-600 dark:bg-blue-500 text-white px-2.5 py-1 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
              title="Copiar plantilla para Facebook"
            >
              📘
            </button>
          </div>
          <p className="text-blue-600 dark:text-blue-400 font-bold mb-1">S/. {product.price.toFixed(2)}</p>
          {product.brand && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">📦 {product.brand}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/admin/products/edit/${product.id}`} className="flex-1 text-center bg-blue-500 dark:bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 text-sm">✏️ Editar</Link>
          <button onClick={() => setShowImageGen(!showImageGen)} className="flex-1 bg-purple-500 dark:bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-600 dark:hover:bg-purple-700 text-sm">🎨 Imagen</button>
          <button onClick={handleDownloadImages} disabled={downloadingImgs} className="bg-cyan-500 dark:bg-cyan-600 text-white px-3 py-2 rounded hover:bg-cyan-600 dark:hover:bg-cyan-700 text-sm disabled:opacity-50" title="Descargar todas las imágenes">
            {downloadingImgs ? "⏳" : "📥"}
          </button>
          <button onClick={() => onCopyTemplate(product)} className="bg-green-500 dark:bg-green-600 text-white px-3 py-2 rounded hover:bg-green-600 dark:hover:bg-green-700 text-sm" title="Copiar plantilla básica">📋</button>
          <button onClick={() => onDelete(product.id)} disabled={deleting} className="bg-red-500 dark:bg-red-600 text-white px-3 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 text-sm">{deleting ? "..." : "🗑️"}</button>
        </div>
        {showImageGen && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <ImageGenerator productName={product.name} productPrice={product.price} productBrand={product.brand} imageUrl={product.imageUrls?.[0]} imageUrls={product.imageUrls} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= BATCH ACTION BAR ================= */
function BatchActionBar({ selectedCount, totalFiltered, onSelectAll, onDeselectAll, onAddToBatch }: any) {
  if (selectedCount === 0 && totalFiltered === 0) return null
  return (
    <div className={`mb-4 p-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
      selectedCount > 0
        ? "bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800"
        : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex items-center gap-3">
        {selectedCount > 0 ? (
          <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
            {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalFiltered} producto{totalFiltered !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {selectedCount === 0 ? (
          <button onClick={onSelectAll} className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Seleccionar todos
          </button>
        ) : (
          <>
            <button onClick={onDeselectAll} className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Deseleccionar
            </button>
            <button onClick={onAddToBatch} className="px-3 py-1.5 text-xs font-medium bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 transition-colors">
              ➕ Añadir al lote ({selectedCount})
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse flex flex-col">
      <div className="h-52 bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="p-4 space-y-3 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="flex gap-2"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" /><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" /></div>
      </div>
    </div>
  )
}