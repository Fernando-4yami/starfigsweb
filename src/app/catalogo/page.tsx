// app/catalogo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getProducts } from '@/lib/firebase/products';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const rawData = await getProducts();
        
        // Transformación y validación segura
        const validatedProducts = rawData.map(item => ({
          id: String(item?.id ?? ''),
          name: String(item?.name ?? ''),
          price: Number(item?.price) || 0,
          imageUrl: String(item?.imageUrl ?? '')
        })).filter(item => (
          item.id && 
          item.name && 
          !isNaN(item.price) && 
          item.imageUrl
        ));

        setProducts(validatedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ... (resto del componente igual)
}