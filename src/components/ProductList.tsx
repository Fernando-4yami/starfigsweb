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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
