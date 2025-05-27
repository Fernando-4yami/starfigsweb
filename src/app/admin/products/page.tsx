'use client';

import React, { useEffect, useState } from 'react';
import { getProducts, deleteProductById, Product } from '@/lib/firebase/products';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProducts() {
    try {
      setLoading(true);
      const prods = await getProducts();
      setProducts(prods);
    } catch (err) {
      setError('Error cargando productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;

    try {
      await deleteProductById(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Error al eliminar producto');
      console.error(err);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrar productos según searchTerm (nombre)
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-4 text-center">Cargando productos...</p>;
  if (error) return <p className="p-4 text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración - Productos</h1>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar productos por nombre..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full mb-6 px-4 py-2 border rounded focus:outline-amber-500"
      />

      {filteredProducts.length === 0 ? (
        <p>No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="border rounded-lg p-4 flex flex-col shadow hover:shadow-lg transition"
            >
              <img
                src={product.imageUrls?.[0] || '/placeholder.png'}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <h2 className="font-semibold text-lg mb-1">{product.name}</h2>
              <p className="text-sm text-gray-600">
                S/. {(product.price ?? 0).toFixed(2)}
              </p>
              {product.heightCm && (
                <p className="text-sm text-gray-500">Altura: {product.heightCm} cm</p>
              )}

              <div className="mt-auto flex justify-between gap-2">
                <Link
                  href={`/admin/products/edit/${product.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center flex-1"
                >
                  Editar
                </Link>

                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex-1"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
