import { getProductBySlug, getProducts } from "@/lib/firebase/products"
import type { Metadata } from "next"
import ProductPageClient from "./ProductPageClient"
import { generateAnyProductMetadata, generateAnyProductJsonLd } from "@/lib/metadata"
import { serializeProduct } from "@/lib/serialize-product"

interface ProductPageProps {
  params: { slug: string }
}

export const revalidate = 600

export async function generateStaticParams() {
  const products = await getProducts(100) // Límite para build
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h1>
          <p className="text-gray-600 mb-8">El producto que buscas no está disponible.</p>
          <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    )
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
