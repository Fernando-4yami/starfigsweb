import ProductCard from './ProductCard';
import type { Product } from '@/lib/firebase/products';

interface Props {
  products: Product[];
}

export default function ProductList({ products }: Props) {
  if (products.length === 0) {
    return <p>No hay productos para mostrar.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
