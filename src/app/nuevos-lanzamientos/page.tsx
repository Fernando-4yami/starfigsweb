import { getNewReleases, Product } from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';

export default async function NuevosLanzamientosPage() {
  let firebaseProducts: Product[] = [];

  try {
    firebaseProducts = await getNewReleases();
  } catch (error) {
    console.error("Error cargando nuevos lanzamientos:", error);
    return (
      <div className="py-6 text-center text-red-500">
        Error al cargar los productos. Por favor intente más tarde.
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Nuevos Lanzamientos</h1>

      {firebaseProducts.length === 0 ? (
        <p className="text-center py-12">No hay nuevos lanzamientos disponibles</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
          {firebaseProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}
