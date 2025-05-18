'use client';
import { useCart } from '@/app/context/CartContext';
import Link from 'next/link';

export default function Navbar() {
  const { cart } = useCart();
  
  const manufacturers = [
    { id: '1', name: 'Bandai Spirits', slug: 'bandai' },
    { id: '2', name: 'Good Smile', slug: 'goodsmile' },
    { id: '3', name: 'Taito', slug: 'taito' }
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <div className="text-2xl font-bold text-red-600">
        Starfigs
      </div>

      <div className="flex gap-6 items-center">
        <Link href="/" className="hover:text-blue-600 font-medium">
          Inicio
        </Link>

        <Link href="/nuevos-lanzamientos" className="hover:text-blue-600 font-medium">
          Nuevos Lanzamientos
        </Link>

        <div className="relative group">
          <button className="flex items-center gap-1 hover:text-blue-600 font-medium">
            Fabricantes <span>▾</span>
          </button>
          <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-md mt-2 z-50 min-w-[180px]">
            {manufacturers.map((m) => (
              <Link
                key={m.id}
                href={`/fabricantes/${m.slug}`}
                className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/carrito" className="text-lg hover:text-blue-600">
          🛒 ({cart.length})
        </Link>
        {/* Enlace al formulario de agregar producto */}
        <Link
          href="/admin/products/add"
          className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
        >
          Agregar Producto
        </Link>
      </div>
    </nav>
);
}
