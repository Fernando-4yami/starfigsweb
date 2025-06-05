'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getPopularProducts,
  getNewReleasesByDateRange,
  Product
} from '@/lib/firebase/products';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

function getPreviousMonthDateRange() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  return { start, end };
}

function getCurrentMonthDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  return { start, end };
}

function getNextMonthStartDate() {
  const now = new Date();
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const month = (now.getMonth() + 1) % 12;

  return new Date(year, month, 1, 0, 0, 0);
}

function getMonthName(monthIndex: number) {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return monthNames[monthIndex];
}

export default function RankingAndReleases() {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [ranking, setRanking] = useState<Product[]>([]);
  const [releases, setReleases] = useState<Product[]>([]);
  const [currentReleases, setCurrentReleases] = useState<Product[]>([]);
  const [scrollPos, setScrollPos] = useState(0);
  const [showMoreNew, setShowMoreNew] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { start: prevStart, end: prevEnd } = getPreviousMonthDateRange();
  const { start: currStart, end: currEnd } = getCurrentMonthDateRange();

  useEffect(() => {
    async function fetchData() {
      try {
        const popular = await getPopularProducts(10);
        const prevReleases = await getNewReleasesByDateRange(prevStart, prevEnd);
        const currReleases = await getNewReleasesByDateRange(currStart, currEnd);

        const nextMonthStart = getNextMonthStartDate();
        const futureReleases = await getNewReleasesByDateRange(
          nextMonthStart,
          new Date('2100-01-01')
        );

        setRanking(popular);
        setReleases(prevReleases);
        setCurrentReleases(currReleases);

        const sortedFuture = futureReleases.sort(
          (a, b) => (b.releaseDate?.seconds || 0) - (a.releaseDate?.seconds || 0)
        );

        setNewProducts(sortedFuture.slice(0, 15));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

    fetchData();
  }, [prevStart, prevEnd, currStart, currEnd]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const cardWidth = e.currentTarget.firstElementChild?.clientWidth || 1;
    const gap = 12;
    setScrollPos(Math.round(scrollLeft / (cardWidth + gap)));
  };

  return (
    <section className="py-12 px-6" style={{ background: 'transparent', minHeight: '100vh' }}>
      {/* NUEVOS LANZAMIENTOS */}
      <h2 className="text-3xl md:text-4xl font-medium text-gray-800 mb-2 text-center tracking-wide select-none">
        Nuevos lanzamientos
      </h2>

      {newProducts.length > 0 && (
        <div className="text-center mb-6 text-amber-700 font-semibold text-lg select-none">
          Próximos lanzamientos
        </div>
      )}

      {newProducts.length === 0 ? (
        <p className="text-center text-gray-500 mb-10">No hay productos nuevos.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-6 w-full mb-6">
            {newProducts
              .slice(0, showMoreNew ? newProducts.length : 12)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>

          {newProducts.length > 12 && (
            <div className="flex justify-center mb-10">
              <button
                onClick={() => setShowMoreNew(!showMoreNew)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded transition"
                type="button"
              >
                {showMoreNew ? 'Ver menos' : 'Ver más'}
              </button>
            </div>
          )}
        </>
      )}

      {/* RANKING */}
      <h2 className="text-3xl md:text-4xl font-medium text-gray-800 mb-10 text-center tracking-wide select-none">
        Ranking
      </h2>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-nowrap overflow-x-auto md:overflow-x-visible justify-start md:justify-center gap-3 -mx-0 md:-mx-6 px-0 md:px-6 scroll-smooth scrollbar-none scroll-snap-x"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {ranking.map((product, i) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="relative flex-shrink-0 w-[28vw] sm:w-44 md:w-44 cursor-pointer select-none scroll-snap-align-start"
            title={product.name}
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="absolute top-2 left-2 z-20 bg-amber-700 bg-opacity-60 backdrop-blur-sm text-white font-bold text-lg px-3 py-1 rounded-lg shadow-lg">
              #{i + 1}
            </div>

            <div
              className="overflow-hidden rounded-none shadow-xl border border-amber-300"
              style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }}
            >
              <img
                src={product.imageUrls?.[0] || '/placeholder.png'}
                alt={product.name}
                className="w-full h-52 object-cover"
              />
            </div>

            <p className="mt-3 text-center text-gray-900 font-semibold truncate">
              {product.name}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-4 gap-2 md:hidden select-none">
        {ranking.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${scrollPos === i ? 'bg-amber-600' : 'bg-gray-300'}`}
          />
        ))}
      </div>

      {/* LANZAMIENTOS DEL MES ACTUAL */}
      <h2 className="text-2xl md:text-3xl font-medium text-gray-800 mt-16 mb-6 text-center tracking-wide select-none">
        Lanzamientos de {getMonthName(currStart.getMonth())}
      </h2>

      {currentReleases.length === 0 ? (
        <p className="text-center text-gray-500">No hay lanzamientos para este mes.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 w-full">
          {currentReleases.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* LANZAMIENTOS DEL MES ANTERIOR */}
      <h2 className="text-2xl md:text-3xl font-medium text-gray-800 mt-16 mb-6 text-center tracking-wide select-none">
        Lanzamientos de {getMonthName(prevStart.getMonth())}
      </h2>

      {releases.length === 0 ? (
        <p className="text-center text-gray-500">No hay lanzamientos para este mes.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 w-full">
          {releases.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
