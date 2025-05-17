// components/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

// Define EXACTAMENTE los campos que usas
interface Product {
  id?: string;         // Opcional porque nuevos productos no tienen ID
  name: string;
  price: number;
  imageUrl: string;
  description?: string; // Opcional
  category?: string;   // Opcional
  brand?: string;      // Opcional
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Imagen del producto */}
      <div className="relative h-48 w-full">
        <Image
          src={product.imageUrl || '/default-product.jpg'} // Fallback si no hay imagen
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      </div>

      {/* Detalles del producto */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex justify-between items-center">
          <span className="font-bold text-red-600">${product.price.toFixed(2)}</span>
          {product.brand && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {product.brand}
            </span>
          )}
        </div>

        {/* Botón de acción */}
        <button className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded transition">
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}