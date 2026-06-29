import { getProductBySlug, getProducts } from "@/lib/firebase/products"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductPageClient from "./ProductPageClient"
import { generateAnyProductMetadata, generateAnyProductJsonLd, generateBreadcrumbJsonLd, CATEGORY_SLUG_TO_NAME } from "@/lib/metadata"
import { serializeProduct } from "@/lib/serialize-product"
import { cache } from "react"

interface ProductPageProps {
  params: { slug: string }
}

export const revalidate = 86400

const getCachedProductBySlug = cache(getProductBySlug)

export async function generateStaticParams() {
  // Prebuild recent products. Other slugs render on demand and stay cached by ISR.
  const products = await getProducts(800)
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const rawProduct = await getCachedProductBySlug(params.slug)
  if (!rawProduct) {
    return {
      title: "Producto no encontrado",
      description: "El producto que buscas no está disponible.",
    }
  }

  return generateAnyProductMetadata(rawProduct)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const rawProduct = await getCachedProductBySlug(params.slug)

  if (!rawProduct) {
    notFound()
  }

  const product = serializeProduct(rawProduct)
  const productJsonLd = generateAnyProductJsonLd(product)
  
  const categoryName = product.category ? (CATEGORY_SLUG_TO_NAME[product.category.toLowerCase()] || product.category) : "Catálogo"
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Inicio", url: "https://starfigsperu.com" },
    { name: categoryName, url: `https://starfigsperu.com/categorias/${product.category?.toLowerCase()}` },
    { name: product.name },
  ])

  return (
    <>
      {/* 🍞 Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

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
