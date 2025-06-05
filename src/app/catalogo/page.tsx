"use client";
import React, { useEffect, useState } from 'react';
import { getProducts, Product } from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';
export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const rawData = await getProducts();

        // Filtrar productos que tengan id, name, price válido y al menos una imagen
        const validatedProducts = rawData.filter(
          (item) =>
            item?.id &&
            item?.name &&
            !isNaN(Number(item.price)) &&
            Array.isArray(item.imageUrls) &&
            item.imageUrls.length > 0
        );

        setProducts(validatedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="py-6 px-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Catálogo</h1>

      {loading && (
        <p className="text-center py-12">Cargando productos...</p>
      )}

      {error && (
        <p className="text-center text-red-500 py-12">
          Error al cargar productos: {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-center py-12">No hay productos disponibles</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product} // Pasamos el producto completo
            />
          ))}
        </div>
      )}
    </div>
  );
}
