import { getProductBySlug, getProductsByBrand, getProducts } from '@/lib/firebase/products';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react'; // Ícono de WhatsApp

interface ProductPageProps {
  params: { slug: string };
}

const Gallery = dynamic(() => import('@/components/Gallery'), { ssr: false });

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map(product => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: `${product.name} | Figuras Coleccionables`,
    description: product.description?.slice(0, 150) || 'Figura coleccionable disponible en nuestra tienda.',
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url:
            Array.isArray(product.imageUrls) && product.imageUrls.length > 0
              ? product.imageUrls[0]
              : '/placeholder.png',
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    console.error(`Producto no encontrado con slug: ${params.slug}`);
    return notFound();
  }

  let relatedProducts = [] as typeof product[];

  if (product.brand) {
    relatedProducts = await getProductsByBrand(product.brand);
    relatedProducts = relatedProducts.filter(p => p.slug !== product.slug);
  }

  const now = new Date();
  const releaseDate = product.releaseDate?.toDate();
  const showReleaseTag =
    !!releaseDate &&
    (releaseDate.getFullYear() > now.getFullYear() ||
      (releaseDate.getFullYear() === now.getFullYear() &&
        releaseDate.getMonth() >= now.getMonth()));

  const releaseMonthYear = releaseDate
    ? format(releaseDate, 'MMMM yyyy', { locale: es }).replace(/^./, str => str.toUpperCase())
    : '';

  const productUrl = `https://tusitioweb.com/products/${product.slug}`;
  const whatsappMessage = `Hola, estoy interesado en reservar el producto *${product.name}*.\n${productUrl}`;
  const whatsappUrl = `https://wa.me/51926951167?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Gallery imageUrls={product.imageUrls ?? []} productName={product.name} />

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {product.releaseDate && (() => {
            const releaseDate = product.releaseDate.toDate();
            const now = new Date();
            const isUpcoming =
              releaseDate.getFullYear() > now.getFullYear() ||
              (releaseDate.getFullYear() === now.getFullYear() &&
                releaseDate.getMonth() >= now.getMonth());

            const releaseMonthYear = format(releaseDate, 'MMMM yyyy', { locale: es }).replace(/^./, str => str.toUpperCase());

            return isUpcoming ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-700 to-pink-500 text-white px-3 py-1 rounded-full shadow">
                  ✨ Pre-venta
                </span>
                <span className="text-sm text-gray-600 font-medium">{releaseMonthYear}</span>
              </div>
            ) : null;
          })()}

          {product.brand && (
            <span className="text-sm text-gray-600">
              Fabricante: <strong>{product.brand}</strong>
            </span>
          )}

          {product.line && (
            <span className="text-sm text-gray-600">
              Línea: <strong>{product.line}</strong>
            </span>
          )}

          {product.heightCm && (
            <span className="text-sm text-gray-600">
              Altura: <strong>{product.heightCm} cm aprox.</strong>
            </span>
          )}

          <p className="text-xl text-red-600 font-semibold">
            S/. {product.price.toFixed(2)}
          </p>

          {product.description && (
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded transition-colors duration-200">
              Añadir al carrito
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors duration-200"
            >
              <MessageCircle size={18} strokeWidth={2} />
              Reservar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
