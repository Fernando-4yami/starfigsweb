import { searchProducts } from "@/lib/firebase/products"
import type { Metadata } from "next"
import SeriesClient from "./SeriesClient"

interface Props {
  params: { slug: string }
}

function slugToSeriesName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const baseUrl = "https://starfigsperu.com"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seriesName = slugToSeriesName(params.slug)
  const products = await searchProducts(seriesName)
  const title = `Figuras de ${seriesName}`
  const description = `Compra figuras de anime de ${seriesName} originales en Perú. ${products.length} modelos disponibles en Nendoroid, Figma, escalas, Ichiban Kuji y más. Envío gratis por Agencias Shalom.`

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/series/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/series/${params.slug}`,
      siteName: "Starfigs",
      images: [
        {
          url: `${baseUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Starfigs Perú - ${seriesName}`,
        },
      ],
      locale: "es_PE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function SeriesPage({ params }: Props) {
  const seriesName = slugToSeriesName(params.slug)
  const products = await searchProducts(seriesName)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Figuras de ${seriesName} | Starfigs Perú`,
    description: `Compra figuras de anime de ${seriesName} en Perú. ${products.length} modelos disponibles. Figuras originales importadas desde Japón. Envío gratis.`,
    url: `https://starfigsperu.com/series/${params.slug}`,
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
      <SeriesClient seriesName={seriesName} products={products} />
    </>
  )
}
