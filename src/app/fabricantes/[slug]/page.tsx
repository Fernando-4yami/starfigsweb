//src/app/fabricantes/[slug]/page.tsx

import { getProductsByBrand, Product } from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
}

const brandMap: Record<string, string> = {
  bandai: 'Bandai Spirits',
  goodsmile: 'Good Smile Company',
  taito: 'Taito',
};

export default async function BrandPage({ params }: Props) {
  const brandName = brandMap[params.slug];
  if (!brandName) return notFound();

  let products: Product[] = [];
  try {
    products = await getProductsByBrand(brandName);
  } catch (error) {
    console.error('Error obteniendo productos por marca:', error);
    return (
      <div className="py-6 text-center text-red-500">
        Error al cargar los productos. Por favor intente más tarde.
      </div>
    );
  }

  return (
    <div className="py-6 px-6">
      <h1 className="text-3xl font-bold mb-6 text-center">{brandName}</h1>
      {products.length === 0 ? (
        <p className="text-center py-12">No hay productos disponibles de esta marca</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product} // PASAMOS EL OBJETO COMPLETO
            />
          ))}
        </div>
      )}
    </div>
  );
}
