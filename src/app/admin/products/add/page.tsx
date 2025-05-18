// src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from 'app/context/CartContext';
import type { Product } from '@/lib/firebase/products';
import productsService from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const { cart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsService.getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bienvenido a Starfigs</h1>
      <p className="mb-6">Productos en el carrito: {cart.length}</p>

      {loading ? (
        <p>Cargando productos...</p>
      ) : products.length === 0 ? (
        <p>No hay productos para mostrar.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map(p => (
            <ProductCard key={p.id!} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
