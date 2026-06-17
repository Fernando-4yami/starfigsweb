import { getProductBySlug, getProducts } from "@/lib/firebase/products"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductPageClient from "./ProductPageClient"
import { generateAnyProductMetadata, generateAnyProductJsonLd } from "@/lib/metadata"
import { serializeProduct } from "@/lib/serialize-product"

interface ProductPageProps {
  params: { slug: string }
}

export const revalidate = 600

export async function generateStaticParams() {
  const products = await getProducts(8000) // Límite para build (más páginas estáticas para Google)
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const rawProduct = await getProductBySlug(params.slug)
  if (!rawProduct) {
    return {
      title: "Producto no encontrado | Starfigs",
      description: "El producto que buscas no está disponible.",
    }
  }

  return generateAnyProductMetadata(rawProduct)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const rawProduct = await getProductBySlug(params.slug)

  if (!rawProduct) {
    notFound()
  }

  const product = serializeProduct(rawProduct)
  const productJsonLd = generateAnyProductJsonLd(product)

  return (
    <>
      {/* 🚀 PRELOAD IMAGEN CRÍTICA */}
      {product.imageUrls?.[0] && (
        <link
          rel="preload"
          as="image"
          href={product.imageUrls[0]}
          // @ts-ignore
          fetchPriority="high"
        />
      )}

      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />

      {/* 🚀 CLIENTE CON DATOS INICIALES */}
      <ProductPageClient params={params} initialProduct={product} />
    </>
  )
}
