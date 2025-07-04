import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  increment,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore"

// 🚀 CACHÉ MÁS AGRESIVO
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos
const POPULAR_CACHE_DURATION = 3 * 60 * 1000 // 3 minutos
const SEARCH_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos para búsquedas

interface CacheEntry {
  data: any
  timestamp: number
  duration: number
}

const cache = new Map<string, CacheEntry>()

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.duration) {
    return cached.data
  }
  if (cached) cache.delete(key)
  return null
}

function setCachedData<T>(key: string, data: T, duration: number = CACHE_DURATION): void {
  cache.set(key, { data, timestamp: Date.now(), duration })
}

// 🧹 Limpieza automática
let cleanupInterval: NodeJS.Timeout | null = null

function startCacheCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(
    () => {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > value.duration) {
          cache.delete(key)
        }
      }
    },
    3 * 60 * 1000,
  ) // Cada 3 minutos
}

startCacheCleanup()

// ✅ UTILIDADES CONSOLIDADAS
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function normalizeText(text: string): string {
  if (!text) return ""
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeForComparison(text: string): string {
  return normalizeText(text).toLowerCase()
}

// 🎯 INTERFAZ OPTIMIZADA
interface FirebaseProductData {
  name?: string
  slug?: string
  price?: number
  description?: string
  imageUrls?: string[]
  thumbnailUrl?: string
  galleryThumbnailUrls?: string[]
  brand?: string
  line?: string
  category?: string
  createdAt?: any
  releaseDate?: any
  heightCm?: number
  scale?: string
  views?: number
  lastViewedAt?: any
  [key: string]: any
}

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  description?: string
  imageUrls: string[]
  thumbnailUrl?: string
  galleryThumbnailUrls?: string[]
  brand?: string
  line?: string
  createdAt?: Date | null
  releaseDate?: Date | null
  heightCm?: number
  scale?: string
  category?: string
  views?: number
  lastViewedAt?: Date | null
}

// 🚀 NORMALIZACIÓN CORREGIDA
function normalizeProduct(docData: any, docId: string): Product {
  const data: FirebaseProductData = docData

  return {
    id: docId,
    name: data.name || "",
    slug: data.slug || generateSlug(data.name || ""),
    price: data.price || 0,
    description: data.description || "",
    imageUrls: data.imageUrls || [],
    thumbnailUrl: data.thumbnailUrl,
    galleryThumbnailUrls: data.galleryThumbnailUrls,
    brand: data.brand || "",
    line: data.line || "",
    category: data.category || "figura",
    createdAt: data.createdAt ? data.createdAt.toDate() : null,
    releaseDate: data.releaseDate ? data.releaseDate.toDate() : null,
    heightCm: data.heightCm || undefined,
    scale: data.scale || undefined,
    views: data.views || 0,
    lastViewedAt: data.lastViewedAt ? data.lastViewedAt.toDate() : null,
  }
}

export interface SearchFilters {
  category?: string
  brand?: string
  line?: string
  minPrice?: number
  maxPrice?: number
  hasReleaseDate?: boolean
}

const productsCollection = collection(db, "products")

// 🚀 CACHÉ DE TODOS LOS PRODUCTOS PARA BÚSQUEDA RÁPIDA
let allProductsCache: Product[] | null = null
let allProductsCacheTime = 0
const ALL_PRODUCTS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

async function getAllProductsForSearch(): Promise<Product[]> {
  const now = Date.now()

  // Usar caché si está disponible y no ha expirado
  if (allProductsCache && now - allProductsCacheTime < ALL_PRODUCTS_CACHE_DURATION) {
    return allProductsCache
  }

  console.log("🔄 Cargando todos los productos para búsqueda...")

  try {
    const allProducts: Product[] = []
    let lastDoc: DocumentSnapshot | null = null
    const batchSize = 1000

    do {
      let q = query(productsCollection, orderBy("createdAt", "desc"), limit(batchSize))

      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const products = snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id))

      allProducts.push(...products)
      lastDoc = snapshot.docs[snapshot.docs.length - 1] || null

      console.log(`📦 Cargados ${allProducts.length} productos...`)
    } while (lastDoc)

    console.log(`✅ Total productos cargados: ${allProducts.length}`)

    // Actualizar caché
    allProductsCache = allProducts
    allProductsCacheTime = now

    return allProducts
  } catch (error) {
    console.error("Error cargando todos los productos:", error)
    return allProductsCache || []
  }
}

// 🚀 FUNCIÓN PARA OBTENER TODOS LOS PRODUCTOS (PARA SINCRONIZACIÓN)
export async function getAllProductsForSync(): Promise<Product[]> {
  return getAllProductsForSearch()
}

// 🚀 PAGINACIÓN OPTIMIZADA
export async function getProductsPaginated(
  limitCount = 50,
  lastDoc?: DocumentSnapshot,
  forceRefresh = false,
): Promise<{ products: Product[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  try {
    const cacheKey = `products-paginated-${limitCount}-${lastDoc?.id || "first"}`

    if (!forceRefresh) {
      const cached = getCachedData<{ products: Product[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }>(
        cacheKey,
      )
      if (cached) return cached
    }

    let q = query(productsCollection, orderBy("createdAt", "desc"), limit(limitCount))

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)
    const products = snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id))
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    const hasMore = snapshot.docs.length === limitCount

    const result = { products, lastDoc: newLastDoc, hasMore }
    setCachedData(cacheKey, result, CACHE_DURATION)
    return result
  } catch (error) {
    console.error("Error obteniendo productos paginados:", error)
    throw new Error("Failed to fetch paginated products")
  }
}

// 🚀 FUNCIÓN PRINCIPAL OPTIMIZADA
export async function getProducts(limitCount = 100, forceRefresh = false): Promise<Product[]> {
  try {
    const cacheKey = `products-limited-${limitCount}`

    if (!forceRefresh) {
      const cached = getCachedData<Product[]>(cacheKey)
      if (cached) return cached
    }

    const q = query(productsCollection, orderBy("createdAt", "desc"), limit(limitCount))
    const snapshot = await getDocs(q)
    const products = snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id))

    setCachedData(cacheKey, products, CACHE_DURATION)
    return products
  } catch (error) {
    console.error("Error obteniendo productos:", error)
    throw new Error("Failed to fetch products")
  }
}

// ✅ Validación optimizada
function validateProduct(product: Partial<Product>): void {
  if (!product.name?.trim()) throw new Error("El nombre del producto es requerido")
  if (!product.price || product.price <= 0) throw new Error("El precio debe ser mayor a 0")
  if (!Array.isArray(product.imageUrls) || product.imageUrls.length === 0) {
    throw new Error("Se requiere al menos una imagen")
  }
}

// 🚀 AGREGAR PRODUCTO OPTIMIZADO
export async function addProduct(
  product: Omit<Product, "id" | "slug"> & {
    createdAt?: Timestamp | null
    releaseDate?: Timestamp | null
  },
): Promise<string> {
  try {
    validateProduct(product)

    const slug = generateSlug(product.name)
    const existingProduct = await getProductBySlug(slug)
    if (existingProduct) {
      throw new Error(`Ya existe un producto con el nombre similar: ${product.name}`)
    }

    const productToAdd = {
      ...product,
      slug,
      category: product.category || "figura",
      createdAt: product.createdAt ?? serverTimestamp(),
      releaseDate: product.releaseDate ?? null,
      views: 0,
      lastViewedAt: null,
    }

    const docRef = await addDoc(productsCollection, productToAdd)

    // Limpiar caché de todos los productos
    allProductsCache = null
    cache.clear()

    return docRef.id
  } catch (error) {
    console.error("Error agregando producto:", error)
    throw error
  }
}

// 🚀 NUEVOS LANZAMIENTOS OPTIMIZADO
export async function getNewReleases(limitCount = 20): Promise<Product[]> {
  try {
    const cacheKey = `new-releases-${limitCount}`
    const cached = getCachedData<Product[]>(cacheKey)
    if (cached) return cached

    const q = query(productsCollection, orderBy("createdAt", "desc"), limit(limitCount))
    const snapshot = await getDocs(q)
    const products = snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id))

    setCachedData(cacheKey, products, CACHE_DURATION)
    return products
  } catch (error) {
    console.error("Error obteniendo nuevos lanzamientos:", error)
    return []
  }
}

// ✅ Producto por ID optimizado
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const cacheKey = `product-id-${productId}`
    const cached = getCachedData<Product>(cacheKey)
    if (cached) return cached

    const docRef = doc(db, "products", productId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return null

    const product = normalizeProduct(docSnap.data(), docSnap.id)
    setCachedData(cacheKey, product, CACHE_DURATION)
    return product
  } catch (error) {
    console.error("Error obteniendo producto por ID:", error)
    return null
  }
}

// ✅ Producto por slug optimizado
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const cacheKey = `product-slug-${slug}`
    const cached = getCachedData<Product>(cacheKey)
    if (cached) return cached

    const q = query(productsCollection, where("slug", "==", slug), limit(1))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    const product = normalizeProduct(docSnap.data(), docSnap.id)

    setCachedData(cacheKey, product, CACHE_DURATION)
    return product
  } catch (error) {
    console.error("Error obteniendo producto por slug:", error)
    throw new Error(`Failed to fetch product with slug: ${slug}`)
  }
}

// 🚨 PRODUCTOS POPULARES CORREGIDO
export async function getPopularProducts(limitCount = 10): Promise<Product[]> {
  try {
    const cacheKey = `popular-${limitCount}`
    const cached = getCachedData<Product[]>(cacheKey)
    if (cached) return cached

    console.log("🔍 Obteniendo productos populares...")

    const q = query(productsCollection, where("views", ">", 0), orderBy("views", "desc"), limit(limitCount * 2))

    const snapshot = await getDocs(q)
    let products = snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id))

    products.sort((a, b) => {
      if (b.views !== a.views) {
        return (b.views || 0) - (a.views || 0)
      }
      const aTime = a.lastViewedAt?.getTime() || 0
      const bTime = b.lastViewedAt?.getTime() || 0
      return bTime - aTime
    })

    products = products.slice(0, limitCount)
    console.log(`✅ ${products.length} productos populares obtenidos`)

    setCachedData(cacheKey, products, POPULAR_CACHE_DURATION)
    return products
  } catch (error) {
    console.error("Error obteniendo productos populares:", error)
    console.log("🔄 Usando fallback: nuevos lanzamientos")
    try {
      const fallbackProducts = await getNewReleases(limitCount)
      console.log(`✅ Fallback: ${fallbackProducts.length} productos obtenidos`)
      return fallbackProducts
    } catch (fallbackError) {
      console.error("Error en fallback:", fallbackError)
      return []
    }
  }
}

// 🚀 LANZAMIENTOS POR FECHA OPTIMIZADO
export async function getNewReleasesByDateRange(startDate: Date, endDate: Date): Promise<Product[]> {
  try {
    const cacheKey = `releases-${startDate.getTime()}-${endDate.getTime()}`
    const cached = getCachedData<Product[]>(cacheKey)
    if (cached) return cached

    const startTimestamp = Timestamp.fromDate(startDate)
    const endTimestamp = Timestamp.fromDate(endDate)

    const q = query(
      productsCollection,
      where("releaseDate", ">=", startTimestamp),
      where("releaseDate", "<=", endTimestamp),
      orderBy("releaseDate", "desc"),
      limit(50),
    )

    const snapshot = await getDocs(q)
    const products = snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id))

    setCachedData(cacheKey, products, CACHE_DURATION)
    return products
  } catch (error) {
    console.error("Error obteniendo lanzamientos por fecha:", error)
    return []
  }
}

// 🚀 BÚSQUEDA POR LÍNEA COMPLETAMENTE REESCRITA - SÚPER AGRESIVA
export async function getProductsByLine(lineToSearch: string, forceRefresh = false): Promise<Product[]> {
  try {
    const cacheKey = `line-enhanced-${lineToSearch.toLowerCase().trim()}`

    if (!forceRefresh) {
      const cached = getCachedData<Product[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 BÚSQUEDA MEJORADA para línea: "${lineToSearch}"`)

    // 🚀 OBTENER TODOS LOS PRODUCTOS DE UNA VEZ
    const allProducts = await getAllProductsForSearch()
    console.log(`📦 Buscando en ${allProducts.length} productos totales...`)

    const searchTerm = normalizeForComparison(lineToSearch)
    const searchWords = searchTerm.split(/\s+/).filter((word) => word.length > 1)

    console.log(`🎯 Término normalizado: "${searchTerm}"`)
    console.log(`🔤 Palabras clave: [${searchWords.join(", ")}]`)

    const foundProducts = allProducts.filter((product) => {
      // 1. BÚSQUEDA EN CAMPO LINE (PRIORIDAD ALTA)
      if (product.line) {
        const productLine = normalizeForComparison(product.line)

        // Coincidencia exacta
        if (productLine === searchTerm) return true

        // Contiene el término completo
        if (productLine.includes(searchTerm)) return true

        // El término contiene la línea del producto
        if (searchTerm.includes(productLine)) return true

        // Búsqueda por palabras individuales en línea
        if (searchWords.some((word) => productLine.includes(word))) return true
      }

      // 2. BÚSQUEDA EN NOMBRE DEL PRODUCTO (PRIORIDAD MEDIA)
      const productName = normalizeForComparison(product.name)

      // Contiene el término completo en el nombre
      if (productName.includes(searchTerm)) return true

      // Búsqueda por palabras individuales en nombre
      if (searchWords.length > 1) {
        const matchingWords = searchWords.filter((word) => productName.includes(word))
        // Si coincide al menos 50% de las palabras
        if (matchingWords.length >= Math.ceil(searchWords.length * 0.5)) return true
      }

      // 3. BÚSQUEDA EN OTROS CAMPOS (PRIORIDAD BAJA)
      const searchableText = [product.brand || "", product.category || "", product.description || ""]
        .join(" ")
        .toLowerCase()

      if (searchableText.includes(searchTerm)) return true

      return false
    })

    // 🎯 ORDENAMIENTO POR RELEVANCIA
    foundProducts.sort((a, b) => {
      let scoreA = 0,
        scoreB = 0

      // Puntuación por coincidencia en línea
      if (a.line) {
        const lineA = normalizeForComparison(a.line)
        if (lineA === searchTerm) scoreA += 1000
        else if (lineA.includes(searchTerm)) scoreA += 500
        else if (searchTerm.includes(lineA)) scoreA += 300
      }

      if (b.line) {
        const lineB = normalizeForComparison(b.line)
        if (lineB === searchTerm) scoreB += 1000
        else if (lineB.includes(searchTerm)) scoreB += 500
        else if (searchTerm.includes(lineB)) scoreB += 300
      }

      // Puntuación por coincidencia en nombre
      const nameA = normalizeForComparison(a.name)
      const nameB = normalizeForComparison(b.name)

      if (nameA.includes(searchTerm)) scoreA += 200
      if (nameB.includes(searchTerm)) scoreB += 200

      // Puntuación por popularidad
      scoreA += (a.views || 0) * 0.1
      scoreB += (b.views || 0) * 0.1

      // Ordenar por score, luego por fecha
      if (scoreA !== scoreB) return scoreB - scoreA
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    })

    console.log(`✅ ENCONTRADOS ${foundProducts.length} productos para "${lineToSearch}"`)

    // Log de los primeros 5 para debug
    foundProducts.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (línea: "${product.line || "N/A"}")`)
    })

    setCachedData(cacheKey, foundProducts, CACHE_DURATION)
    return foundProducts
  } catch (error) {
    console.error("Error en getProductsByLine mejorado:", error)
    return []
  }
}

// 🚀 INCREMENTAR VISTAS OPTIMIZADO
export async function incrementProductViews(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId)

    await updateDoc(docRef, {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
    })

    const keysToDelete = Array.from(cache.keys()).filter(
      (key) =>
        key.startsWith("popular-") || key.startsWith("product-id-" + productId) || key.startsWith("product-slug-"),
    )

    keysToDelete.forEach((key) => cache.delete(key))
  } catch (error) {
    console.error("Error incrementando views:", error)
  }
}

// ✅ Actualizar producto optimizado
export async function updateProduct(id: string, data: Partial<Omit<Product, "id" | "createdAt">>): Promise<void> {
  try {
    if (data.name || data.price || data.imageUrls) {
      validateProduct({
        ...data,
        name: data.name || "temp",
        price: data.price || 1,
        imageUrls: data.imageUrls || ["temp"],
      })
    }

    if (data.name) {
      data.slug = generateSlug(data.name)
    }

    const updateData = {
      ...data,
      ...(data.views === undefined && { views: 0 }),
      ...(data.category === undefined && { category: "figura" }),
    }

    const docRef = doc(db, "products", id)
    await updateDoc(docRef, updateData)

    // Limpiar caché
    allProductsCache = null
    const keysToDelete = Array.from(cache.keys()).filter(
      (key) => key.includes(id) || key.startsWith("products-") || key.startsWith("popular-"),
    )
    keysToDelete.forEach((key) => cache.delete(key))
  } catch (error) {
    console.error("Error actualizando producto:", error)
    throw new Error(`Failed to update product with ID: ${id}`)
  }
}

// ✅ Eliminar producto optimizado
export async function deleteProductById(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId)
    await deleteDoc(docRef)

    allProductsCache = null
    cache.clear()
  } catch (error) {
    console.error("Error eliminando producto:", error)
    throw new Error(`Failed to delete product with ID: ${productId}`)
  }
}

// 🚀 BÚSQUEDA SÚPER AGRESIVA - ENCUENTRA TODO
export async function searchProducts(searchTerm: string, filters?: SearchFilters): Promise<Product[]> {
  try {
    const startTime = Date.now()
    const cacheKey = `search-${searchTerm}-${JSON.stringify(filters)}`
    const cached = getCachedData<Product[]>(cacheKey)
    if (cached) {
      console.log(`⚡ Búsqueda desde caché: ${Date.now() - startTime}ms`)
      return cached
    }

    console.log(`🔍 Búsqueda agresiva: "${searchTerm}"`)

    if (!searchTerm.trim()) {
      const recent = await getProducts(50)
      return recent
    }

    // 🚀 OBTENER TODOS LOS PRODUCTOS DE UNA VEZ
    const allProducts = await getAllProductsForSearch()
    console.log(`📦 Buscando en ${allProducts.length} productos...`)

    const term = searchTerm.toLowerCase().trim()
    const normalizedTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const searchWords = normalizedTerm.split(/\s+/).filter((word) => word.length > 0)

    // 🎯 BÚSQUEDA SÚPER COMPLETA
    const results = allProducts.filter((product) => {
      // Crear texto de búsqueda completo
      const searchableText = [
        product.name || "",
        product.description || "",
        product.brand || "",
        product.line || "",
        product.scale || "",
        product.category || "",
      ]
        .join(" ")
        .toLowerCase()

      const normalizedProductText = searchableText.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

      // 1. Búsqueda directa (más rápida)
      if (normalizedProductText.includes(normalizedTerm)) return true

      // 2. Búsqueda por palabras individuales
      if (searchWords.length > 1) {
        const wordMatches = searchWords.filter((word) => normalizedProductText.includes(word))
        // Si coincide al menos 50% de las palabras
        if (wordMatches.length >= Math.ceil(searchWords.length * 0.5)) return true
      }

      // 3. Búsqueda en campos específicos (más flexible)
      return searchWords.some((word) => {
        if (word.length < 2) return false

        return (
          (product.name || "").toLowerCase().includes(word) ||
          (product.brand || "").toLowerCase().includes(word) ||
          (product.line || "").toLowerCase().includes(word) ||
          (product.scale || "").toLowerCase().includes(word) ||
          (product.description || "").toLowerCase().includes(word)
        )
      })
    })

    console.log(`📦 Encontrados ${results.length} productos antes de ordenar`)

    // 🎯 ORDENAMIENTO POR RELEVANCIA MEJORADO
    results.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()

      let scoreA = 0,
        scoreB = 0

      // Coincidencia exacta en nombre (máxima prioridad)
      if (aName === term) scoreA += 1000
      if (bName === term) scoreB += 1000

      // Empieza con el término
      if (aName.startsWith(term)) scoreA += 500
      if (bName.startsWith(term)) scoreB += 500

      // Contiene el término completo
      if (aName.includes(term)) scoreA += 200
      if (bName.includes(term)) scoreB += 200

      // Coincidencias en marca y línea
      if ((a.brand || "").toLowerCase().includes(term)) scoreA += 150
      if ((b.brand || "").toLowerCase().includes(term)) scoreB += 150
      if ((a.line || "").toLowerCase().includes(term)) scoreA += 150
      if ((b.line || "").toLowerCase().includes(term)) scoreB += 150

      // Coincidencias por palabras individuales
      searchWords.forEach((word) => {
        if (aName.includes(word)) scoreA += 50
        if (bName.includes(word)) scoreB += 50
        if ((a.brand || "").toLowerCase().includes(word)) scoreA += 30
        if ((b.brand || "").toLowerCase().includes(word)) scoreB += 30
        if ((a.line || "").toLowerCase().includes(word)) scoreA += 30
        if ((b.line || "").toLowerCase().includes(word)) scoreB += 30
      })

      // Popularidad (menor peso)
      scoreA += (a.views || 0) * 0.1
      scoreB += (b.views || 0) * 0.1

      // Ordenar por score, luego por fecha
      if (scoreA !== scoreB) return scoreB - scoreA
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    })

    // Aplicar filtros adicionales
    let finalResults = results
    if (filters) {
      if (filters.category) finalResults = finalResults.filter((p) => p.category === filters.category)
      if (filters.brand) finalResults = finalResults.filter((p) => p.brand === filters.brand)
      if (filters.line) finalResults = finalResults.filter((p) => p.line === filters.line)
      if (filters.minPrice) finalResults = finalResults.filter((p) => p.price >= filters.minPrice!)
      if (filters.maxPrice) finalResults = finalResults.filter((p) => p.price <= filters.maxPrice!)
    }

    // Limitar resultados para mejor rendimiento
    finalResults = finalResults.slice(0, 100)

    const searchTime = Date.now() - startTime
    console.log(`✅ Búsqueda completada: ${finalResults.length} resultados en ${searchTime}ms`)

    setCachedData(cacheKey, finalResults, SEARCH_CACHE_DURATION)
    return finalResults
  } catch (error) {
    console.error("Error en búsqueda:", error)
    return []
  }
}

// 🧹 Utilidades de caché optimizadas
export function clearProductsCache(): void {
  allProductsCache = null
  cache.clear()
  console.log("🧹 Caché limpiado completamente")
}

export function getCacheInfo(): { size: number; keys: string[]; duration: number; memoryUsage: string } {
  const memoryUsage = `${Math.round(cache.size * 0.001)}KB`
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    duration: CACHE_DURATION,
    memoryUsage,
  }
}

// Aliases para compatibilidad
export const getAllProducts = getProducts
export const getProductsByBrand = async (brand: string) => searchProducts("", { brand })
export const getProductsByCategory = async (category: string) => searchProducts("", { category })
