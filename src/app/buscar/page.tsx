import { getAllProducts, Product } from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';

type SearchPageProps = {
  searchParams: { q?: string };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.toLowerCase() || '';

  const allProducts: Product[] = await getAllProducts();

  const filtered = query.trim()
    ? allProducts.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query)
      )
    : [];

  return (
    <div className="py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {query ? `Resultados para "${query}"` : 'Ingresa una búsqueda'}
      </h1>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">
          {query ? 'No se encontraron productos.' : 'No se ha ingresado ningún término de búsqueda.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
