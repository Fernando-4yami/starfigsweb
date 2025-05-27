import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface Product {
  id: string;
  slug: string;
  name: string;
  imageUrls: string[];
  price: number;
  heightCm?: number;
  createdAt?: Timestamp | null;
  isNewRelease?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const now = new Date();
  const createdAtDate = product.createdAt?.toDate();

  // Mostrar la etiqueta si el producto se lanza en el mes actual o más adelante
  const showReleaseTag =
    !!createdAtDate &&
    (createdAtDate.getFullYear() > now.getFullYear() ||
      (createdAtDate.getFullYear() === now.getFullYear() &&
        createdAtDate.getMonth() >= now.getMonth())); // >= incluye el mes actual

  const releaseMonthYear = createdAtDate
    ? format(createdAtDate, 'MMMM yyyy', { locale: es }).replace(/^./, str => str.toUpperCase())
    : '';

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block text-inherit no-underline"
    >
      <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
        <div className="relative w-full" style={{ paddingTop: '100%' }}>
          {showReleaseTag && (
            <span className="absolute top-2 left-2 bg-amber-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-md z-10">
              {releaseMonthYear}
            </span>
          )}
          <Image
            src={product.imageUrls?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-4 flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.heightCm && (
            <span className="text-sm text-gray-500">
              Altura: <strong>{product.heightCm} cm</strong>
            </span>
          )}

          <span className="text-red-600 font-bold text-lg">
            S/. {product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
