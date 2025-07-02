// 🚀 CACHE ESPECIALIZADO PARA PRODUCTOS RELACIONADOS
import type { Product } from "@/lib/firebase/products"

interface RelatedProductsEntry {
  products: Product[]
  timestamp: number
  searchCriteria: {
    line?: string
    series: string[]
    name: string
  }
}

interface RelatedProductsCache {
  [key: string]: RelatedProductsEntry
}

// Cache en memoria para productos relacionados
let relatedProductsCache: RelatedProductsCache = {}

// Duración del cache: 15 minutos (más tiempo que el cache normal)
const RELATED_CACHE_DURATION = 15 * 60 * 1000

// 🎯 GENERAR CLAVE DE CACHE INTELIGENTE
function generateCacheKey(currentProductId: string, line?: string, series?: string[], name?: string): string {
  const seriesKey = series && series.length > 0 ? series.sort().join("|") : ""
  const lineKey = line || ""
  const nameKey = name || ""

  // Crear una clave única basada en los criterios de búsqueda
  return `related-${currentProductId}-${lineKey}-${seriesKey}-${nameKey}`.toLowerCase()
}

// 🚀 OBTENER PRODUCTOS RELACIONADOS DEL CACHE
export function getCachedRelatedProducts(
  currentProductId: string,
  line?: string,
  series?: string[],
  name?: string,
): Product[] | null {
  const cacheKey = generateCacheKey(currentProductId, line, series, name)
  const cached = relatedProductsCache[cacheKey]

  if (!cached) {
    console.log(`❌ No hay cache para: ${cacheKey}`)
    return null
  }

  const now = Date.now()
  const isExpired = now - cached.timestamp > RELATED_CACHE_DURATION

  if (isExpired) {
    console.log(`⏰ Cache expirado para: ${cacheKey}`)
    delete relatedProductsCache[cacheKey]
    return null
  }

  console.log(`✅ Cache hit para productos relacionados: ${cached.products.length} productos`)
  return cached.products
}

// 🚀 GUARDAR PRODUCTOS RELACIONADOS EN CACHE
export function setCachedRelatedProducts(
  currentProductId: string,
  products: Product[],
  line?: string,
  series?: string[],
  name?: string,
): void {
  const cacheKey = generateCacheKey(currentProductId, line, series, name)

  relatedProductsCache[cacheKey] = {
    products,
    timestamp: Date.now(),
    searchCriteria: {
      line,
      series: series || [],
      name: name || "",
    },
  }

  console.log(`💾 Guardado en cache: ${products.length} productos relacionados para ${cacheKey}`)
}

// 🧹 LIMPIAR CACHE EXPIRADO
export function cleanupRelatedProductsCache(): void {
  const now = Date.now()
  let cleanedCount = 0

  Object.keys(relatedProductsCache).forEach((key) => {
    const entry = relatedProductsCache[key]
    if (now - entry.timestamp > RELATED_CACHE_DURATION) {
      delete relatedProductsCache[key]
      cleanedCount++
    }
  })

  if (cleanedCount > 0) {
    console.log(`🧹 Limpiadas ${cleanedCount} entradas de cache expiradas`)
  }
}

// 🚀 OBTENER PRODUCTOS RELACIONADOS POR LÍNEA (CON CACHE)
export function getCachedRelatedProductsByLine(line: string): Product[] | null {
  const cacheKey = `line-related-${line.toLowerCase().trim()}`
  const cached = relatedProductsCache[cacheKey]

  if (!cached) return null

  const now = Date.now()
  const isExpired = now - cached.timestamp > RELATED_CACHE_DURATION

  if (isExpired) {
    delete relatedProductsCache[cacheKey]
    return null
  }

  console.log(`✅ Cache hit para línea "${line}": ${cached.products.length} productos`)
  return cached.products
}

// 🚀 GUARDAR PRODUCTOS RELACIONADOS POR LÍNEA
export function setCachedRelatedProductsByLine(line: string, products: Product[]): void {
  const cacheKey = `line-related-${line.toLowerCase().trim()}`

  relatedProductsCache[cacheKey] = {
    products,
    timestamp: Date.now(),
    searchCriteria: {
      line,
      series: [],
      name: "",
    },
  }

  console.log(`💾 Guardado en cache por línea "${line}": ${products.length} productos`)
}

// 🚀 INVALIDAR CACHE CUANDO SE AGREGA/ACTUALIZA UN PRODUCTO
export function invalidateRelatedProductsCache(productId?: string): void {
  if (productId) {
    // Invalidar solo las entradas relacionadas con este producto
    Object.keys(relatedProductsCache).forEach((key) => {
      if (key.includes(productId)) {
        delete relatedProductsCache[key]
      }
    })
    console.log(`🗑️ Cache invalidado para producto: ${productId}`)
  } else {
    // Limpiar todo el cache
    relatedProductsCache = {}
    console.log(`🗑️ Todo el cache de productos relacionados limpiado`)
  }
}

// 🔍 OBTENER INFORMACIÓN DEL CACHE
export function getRelatedProductsCacheInfo(): {
  totalEntries: number
  totalProducts: number
  cacheKeys: string[]
  memoryUsage: string
} {
  const entries = Object.values(relatedProductsCache)
  const totalProducts = entries.reduce((sum, entry) => sum + entry.products.length, 0)
  const memoryUsage = `${Math.round(Object.keys(relatedProductsCache).length * 0.1)}KB`

  return {
    totalEntries: entries.length,
    totalProducts,
    cacheKeys: Object.keys(relatedProductsCache),
    memoryUsage,
  }
}

// 🚀 INICIALIZAR LIMPIEZA AUTOMÁTICA
let cleanupInterval: NodeJS.Timeout | null = null

export function startRelatedProductsCacheCleanup(): void {
  if (cleanupInterval) return

  cleanupInterval = setInterval(
    () => {
      cleanupRelatedProductsCache()
    },
    5 * 60 * 1000,
  ) // Cada 5 minutos

  console.log("🚀 Limpieza automática de cache iniciada")
}

// Inicializar automáticamente
if (typeof window !== "undefined") {
  startRelatedProductsCacheCleanup()
}
