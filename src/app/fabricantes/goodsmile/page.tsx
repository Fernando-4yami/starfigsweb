// src/app/fabricantes/goodsmile/page.tsx

import { getProductsByBrand, Product } from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';

export default async function GSCPage() {
  let products: Product[] = [];

  try {
    products = await getProductsByBrand('Good Smile Company'); // Filtrando por esta marca
  } catch (error) {
    console.error('Error obteniendo productos de Good Smile Company:', error);
    return (
      <div className="py-6 text-center text-red-500">
        Error al cargar los productos. Por favor intente más tarde.
      </div>
    );
  }

  return (
    <div className="py-6 px-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Good Smile Company</h1>
      {products.length === 0 ? (
        <p className="text-center py-12">No hay productos disponibles de esta marca</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}  // PASAMOS EL OBJETO COMPLETO
            />
          ))}
        </div>
      )}
    </div>
  );
}
