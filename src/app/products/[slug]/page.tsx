// app/products/[slug]/page.tsx

import { getProductBySlug, getProductsByBrand, getProducts } from '@/lib/firebase/products';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';

interface ProductPageProps {
  params: { slug: string };
}

const Gallery = dynamic(() => import('@/components/Gallery'), { ssr: false });

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map(product => ({
    slug: product.slug, // asegurarte que cada producto tenga un slug en la base
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: `${product.name} | Figuras Coleccionables`,
    description: product.description?.slice(0, 150) || 'Figura coleccionable disponible en nuestra tienda.',
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url:
            Array.isArray(product.imageUrls) && product.imageUrls.length > 0
              ? product.imageUrls[0]
              : '/placeholder.png',
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) return notFound();

  let relatedProducts = [] as typeof product[];

  if (product.brand) {
    relatedProducts = await getProductsByBrand(product.brand);
    relatedProducts = relatedProducts.filter(p => p.slug !== product.slug);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Gallery imageUrls={product.imageUrls ?? []} productName={product.name} />

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {product.brand && (
            <span className="text-sm text-gray-600">
              Fabricante: <strong>{product.brand}</strong>
            </span>
          )}
          {product.heightCm && (
            <span className="text-sm text-gray-600">
              Altura: <strong>{product.heightCm} cm aprox.</strong>
            </span>
          )}

          <p className="text-xl text-red-600 font-semibold">
            S/. {product.price.toFixed(2)}
          </p>

          {product.description && (
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          )}

          {product.isNewRelease && (
            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold rounded-full w-fit">
              Nuevo Lanzamiento
            </span>
          )}

          <button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded">
            Añadir al carrito
          </button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
