'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/firebase/products';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const handleAddToCart = () => {
    if (onAddToCart) onAddToCart(product);
  };

  return (
    <div className="flex flex-col w-full max-w-sm min-w-0 bg-white border border-gray-300 rounded-lg overflow-hidden shadow hover:shadow-md transition">
      {/* contenedor cuadrado para la imagen */}
      <Link
        href={`/products/${product.id}`}
        className="relative w-full aspect-square"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1 hover:underline">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2 flex-grow">
            {product.description}
          </p>
        )}

        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-red-600">
            ${product.price.toFixed(2)}
          </span>
          {product.brand && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {product.brand}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="mt-auto w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded"
          type="button"
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
