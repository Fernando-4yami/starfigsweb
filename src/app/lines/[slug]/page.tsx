import type { Product } from "@/lib/firebase/products"
import { generateLineMetadata, generateBreadcrumbJsonLd } from "@/lib/metadata"
import type { Metadata } from "next"
import LinesClient from "./LinesClient"
import generatedIndex from "@/lib/search/generated-index.json"
import { expandImageUrl } from "@/lib/search/image-url"
import type {
  CompactDiscount,
  CompactSearchIndexEntry,
} from "@/lib/search/index-types"

interface Props {
  params: { slug: string }
}

const CATEGORY_LINE_NAMES = new Set([
  "nendoroid",
  "figma",
  "s.h.figuarts",
  "ichiban kuji",
  "pop up parade",
  "pop-up parade",
])

const searchIndex = generatedIndex as CompactSearchIndexEntry[]

function lineToSlug(lineName: string): string {
  return lineName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function slugToLineName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function parseDiscount(discount: CompactDiscount | null): Product["discount"] {
  if (!discount) return undefined

  return {
    isActive: discount[0],
    type: discount[1],
    value: discount[2],
    startDate: discount[3] ? new Date(discount[3]) : null,
    endDate: discount[4] ? new Date(discount[4]) : null,
  }
}

function indexEntryToProduct(entry: CompactSearchIndexEntry): Product {
  const [
    id,
    name,
    slug,
    price,
    compactImageUrl,
    compactThumbnailUrl,
    brand,
    line,
    createdAtMs,
    releaseDate,
    heightCm,
    scale,
    views,
    discount,
  ] = entry
  const imageUrl = expandImageUrl(compactImageUrl)

  return {
    id,
    name,
    slug,
    price,
    imageUrls: imageUrl ? [imageUrl] : [],
    thumbnailUrl: expandImageUrl(compactThumbnailUrl) || undefined,
    brand: brand || "",
    line: line || "",
    category: "figura",
    createdAt: createdAtMs ? new Date(createdAtMs) : null,
    releaseDate: releaseDate ? new Date(releaseDate) : null,
    heightCm: heightCm || undefined,
    scale: scale || undefined,
    views,
    discount: parseDiscount(discount),
  }
}

function getLineProducts(slug: string): Product[] {
  return searchIndex
    .filter((entry) => {
      const line = entry[7]
      return line && lineToSlug(line) === slug
    })
    .map(indexEntryToProduct)
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
}

export function generateStaticParams() {
  const uniqueLines = new Set<string>()

  searchIndex.forEach((entry) => {
    const line = entry[7]?.trim()
    if (line && !CATEGORY_LINE_NAMES.has(line.toLowerCase())) {
      const slug = lineToSlug(line)
      if (slug) uniqueLines.add(slug)
    }
  })

  return Array.from(uniqueLines).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const products = getLineProducts(params.slug)
  const lineName = products[0]?.line || slugToLineName(params.slug)
  return generateLineMetadata(lineName, products.length)
}

export default async function LinePage({ params }: Props) {
  const products = getLineProducts(params.slug)
  const lineName = products[0]?.line || slugToLineName(params.slug)

  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Inicio", url: "https://starfigsperu.com" },
    { name: "Lineas", url: "https://starfigsperu.com/catalogo" },
    { name: lineName },
  ])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${lineName} | Starfigs Peru`,
    description: `Compra figuras de la linea ${lineName} en Peru. ${products.length} modelos disponibles. Envio gratis.`,
    url: `https://starfigsperu.com/lines/${params.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Starfigs",
      url: "https://starfigsperu.com",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LinesClient lineName={lineName} products={products} />
    </>
  )
}
