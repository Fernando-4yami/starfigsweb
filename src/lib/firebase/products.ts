// src/lib/firebase/products.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  where,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

import { db } from './firebase';

export interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  brand: string;
  brandSlug?: string;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FirestoreProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const toDate = (timestamp: Timestamp | undefined): Date | undefined => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return undefined;
};

const mapToProduct = (docId: string, data: DocumentData): Product => {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : undefined;
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt : undefined;

  return {
    id: docId,
    name: typeof data.name === 'string' ? data.name : '',
    price: typeof data.price === 'number' ? data.price : 0,
    description: typeof data.description === 'string' ? data.description : '',
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '/placeholder-product.jpg',
    category: typeof data.category === 'string' ? data.category : '',
    brand: typeof data.brand === 'string' ? data.brand : '',
    brandSlug: typeof data.brandSlug === 'string' ? data.brandSlug : '',
    stock: typeof data.stock === 'number' ? data.stock : 0,
    createdAt: toDate(createdAt),
    updatedAt: toDate(updatedAt)
  };
};

export async function getNewReleases(): Promise<Product[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const q = query(
    collection(db, 'products'),
    where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
    orderBy('createdAt', 'desc'),
    limit(12)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapToProduct(doc.id, doc.data()));
}

export async function getProducts(): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapToProduct(doc.id, doc.data()));
}

export async function getProductsByBrand(brandSlug: string): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('brandSlug', '==', brandSlug.toLowerCase()),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapToProduct(doc.id, doc.data()));
}

export async function uploadImage(file: File): Promise<string> {
  if (!file) throw new Error("No se proporcionó archivo");

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error('Error al subir la imagen');
  }

  const data = await res.json();
  return data.url as string;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  // Validación previa
  if (!product.name || product.name.trim() === '') {
    throw new Error("El nombre es requerido");
  }
  if (typeof product.price !== 'number' || isNaN(product.price) || product.price <= 0) {
    throw new Error("El precio debe ser un número mayor a cero");
  }
  if (typeof product.stock !== 'number' || isNaN(product.stock) || product.stock < 0) {
    throw new Error("El stock debe ser un número igual o mayor a cero");
  }

  const productToAdd: FirestoreProduct = {
    ...product,
    brandSlug: product.brand.toLowerCase().replace(/\s+/g, '-'),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  try {
    const docRef = await addDoc(collection(db, 'products'), productToAdd);
    return docRef.id;
  } catch (err: any) {
    // Imprime el objeto completo (incluye props no enumerables)
    console.error(
      'Error firebase al agregar producto (objeto completo):',
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    // Lanza un error con el JSON completo para verlo en frontend
    throw new Error(
      `Firebase Error completo: ${JSON.stringify(
        err,
        Object.getOwnPropertyNames(err)
      )}`
    );
  }
}

export const productsService = {
  getProducts,
  getProductsByBrand,
  getNewReleases,
  uploadImage,
  addProduct
};

export default productsService;
