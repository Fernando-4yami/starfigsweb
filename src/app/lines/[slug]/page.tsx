import { getProductsByLine, type Product } from "@/lib/firebase/products"
import { generateLineMetadata } from "@/lib/metadata"
import type { Metadata } from "next"
import LinesClient from "./LinesClient"

interface Props {
  params: { slug: string }
}

// Cache en memoria de 30 min para evitar lecturas repetidas a Firestore
const LINE_CACHE_TTL = 30 * 60 * 1000 // 30 minutos

function getCachedLine(slug: string): Product[] | null {
  const key = `line-cache-${slug}`
  const cached = (globalThis as any)[key]
  if (cached && Date.now() - cached.timestamp < LINE_CACHE_TTL) {
    return cached.products
  }
  return null
}

function setCachedLine(slug: string, products: Product[]): void {
  const key = `line-cache-${slug}`
  ;(globalThis as any)[key] = {
    products,
    timestamp: Date.now(),
  }
}

// Convierte un slug como "look-up-series" a "Look Up Series"
function slugToLineName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Busca productos con caché de 30 min (evita duplicar lógica en generateMetadata y LinePage)
async function fetchLineProducts(slug: string): Promise<Product[]> {
  const cached = getCachedLine(slug)
  if (cached) return cached
  const products = await getProductsByLine(slugToLineName(slug))
  setCachedLine(slug, products)
  return products
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const products = await fetchLineProducts(params.slug)
  return generateLineMetadata(slugToLineName(params.slug), products.length)
}

export default async function LinePage({ params }: Props) {
  const products = await fetchLineProducts(params.slug)
  return <LinesClient lineName={slugToLineName(params.slug)} products={products} />
}
