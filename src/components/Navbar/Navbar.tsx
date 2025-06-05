'use client';
import { useCart } from '@/app/context/CartContext';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const categories = [
    { name: 'ICHIBAN KUJI', path: '/categorias/ichiban-kuji' },
    { name: 'POP UP PARADE', path: '/categorias/pop-up-parade' },
    { name: 'NENDOROID', path: '/categorias/nendoroid' },
    { name: 'FIGMA', path: '/categorias/figma' },
    { name: 'FIGUARTS', path: '/categorias/figuarts' },
    { name: 'PLUSH', path: '/categorias/plush' },
    { name: 'SCALE', path: '/categorias/scale' },
    { name: 'FIGURAS PRICING', path: '/categorias/pricing' },
  ];

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
      {/* Logo + Buscador */}
      <div className="flex items-center gap-4">
        <Link href="/" className="text-2xl font-bold text-red-600 whitespace-nowrap">
          Starfigs
        </Link>

        <form onSubmit={handleSearch} className="w-44 sm:w-64">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Botón Hamburguesa en Móvil */}
      <button
        className="lg:hidden text-gray-700"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Menú en Pantallas Grandes */}
      <div className="hidden lg:flex gap-6 items-center">
        {categories.map((c) => (
          <Link key={c.name} href={c.path} className="hover:text-blue-600 font-medium">
            {c.name}
          </Link>
        ))}

        <Link href="/carrito" className="text-lg hover:text-blue-600">
          🛒 ({cart.length})
        </Link>

        <Link
          href="/admin/products/add"
          className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
        >
          Agregar Producto
        </Link>
      </div>

      {/* Menú Móvil SUPERPUESTO */}
      {mobileMenuOpen && (
        <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg p-6 flex flex-col gap-4 z-50 transition-transform duration-300 lg:hidden">
          <button
            className="self-end mb-4 text-gray-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>

          {categories.map((c) => (
            <Link
              key={c.name}
              href={c.path}
              className="hover:text-blue-600 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {c.name}
            </Link>
          ))}

          <Link href="/carrito" className="text-lg hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
            🛒 ({cart.length})
          </Link>

          <Link
            href="/admin/products/add"
            className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition w-fit"
            onClick={() => setMobileMenuOpen(false)}
          >
            Agregar Producto
          </Link>
        </div>
      )}
    </nav>
  );
}