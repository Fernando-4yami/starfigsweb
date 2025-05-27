'use client';
import { useCart } from '@/app/context/CartContext';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { cart } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const manufacturers = [
    { id: '1', name: 'Bandai Spirits', slug: 'bandai' },
    { id: '2', name: 'Good Smile', slug: 'goodsmile' },
    { id: '3', name: 'Taito', slug: 'taito' }
  ];

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
      {/* Logo + Buscador */}
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-red-600 whitespace-nowrap">
          Starfigs
        </div>

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
        <Link href="/" className="hover:text-blue-600 font-medium">
          Inicio
        </Link>

        <Link href="/nuevos-lanzamientos" className="hover:text-blue-600 font-medium">
          Nuevos Lanzamientos
        </Link>

        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className="flex items-center gap-1 hover:text-blue-600 font-medium">
            Fabricantes <span>▾</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute bg-white shadow-lg rounded-md mt-2 z-50 min-w-[180px] pointer-events-auto">
              {manufacturers.map((m) => (
                <Link
                  key={m.id}
                  href={`/fabricantes/${m.slug}`}
                  className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                  onClickCapture={() => setIsDropdownOpen(false)}
                >
                  {m.name}
                </Link>
              ))}
            </div>
          )}
        </div>

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

          <Link href="/" className="hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
            Inicio
          </Link>

          <Link href="/nuevos-lanzamientos" className="hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
            Nuevos Lanzamientos
          </Link>

          <div className="border-t pt-2">
            <span className="font-medium text-gray-700">Fabricantes</span>
            <div className="pl-2 mt-1 space-y-1">
              {manufacturers.map((m) => (
                <Link
                  key={m.id}
                  href={`/fabricantes/${m.slug}`}
                  className="block hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>

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
