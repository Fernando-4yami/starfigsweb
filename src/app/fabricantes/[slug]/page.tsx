// app/fabricantes/[slug]/page.tsx
import { getProductsByBrand } from "@/lib/firebase/products";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/firebase/products"; // Importa la interfaz desde el mismo archivo

export default async function BrandPage({
  params,
}: {
  params: { slug: string };
}) {
  let products: Product[] = [];
  let error: string | null = null;
  
  try {
    products = await getProductsByBrand(params.slug);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido';
    console.error(error);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        Productos de {params.slug.toUpperCase()}
      </h1>

      {error ? (
        <div className="text-red-500">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p>No se encontraron productos para esta marca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{
                id: product.id!,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                // Añade más props si tu ProductCard los necesita
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}