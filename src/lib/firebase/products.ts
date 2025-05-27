import { db } from './config';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';

// ✅ NUEVO: función para generar slug limpio desde el nombre
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // eliminar tildes
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface Product {
  id: string;
  name: string;
  slug: string; // ✅ NUEVO campo obligatorio
  price: number;
  description?: string;
  imageUrls: string[];
  brand?: string;
  createdAt?: Timestamp | null;
  isNewRelease?: boolean;
  heightCm?: number;
  views?: number;
}

const productsCollection = collection(db, 'products');

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(productsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, 'id'>),
  }));
}

export async function addProduct(
  product: Omit<Product, 'id' | 'slug'> & { createdAt?: Timestamp | null }
): Promise<void> {
  if (!Array.isArray(product.imageUrls)) {
    throw new Error('imageUrls debe ser un arreglo de strings');
  }

  const slug = generateSlug(product.name); // ✅ Generar slug automático

  await addDoc(productsCollection, {
    ...product,
    slug,
    createdAt: product.createdAt ?? serverTimestamp(),
    views: 0,
  });
}

export async function getNewReleases(): Promise<Product[]> {
  const q = query(
    productsCollection,
    where('isNewRelease', '==', true),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, 'id'>),
  }));
}

export async function getProductsByBrand(brandName: string): Promise<Product[]> {
  const q = query(
    productsCollection,
    where('brand', '==', brandName),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, 'id'>),
  }));
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...(docSnap.data() as Omit<Product, 'id'>),
    };
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error);
    return null;
  }
}

export async function deleteProductById(productId: string): Promise<void> {
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
    console.log(`Producto con ID ${productId} eliminado correctamente.`);
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, data);
    console.log(`Producto con ID ${id} actualizado correctamente.`);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

export async function incrementProductViews(productId: string): Promise<void> {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, { views: increment(1) });
  } catch (error) {
    console.error('Error incrementando views:', error);
  }
}

export async function getPopularProducts(limitCount = 10): Promise<Product[]> {
  const q = query(productsCollection, orderBy('views', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, 'id'>),
  }));
}

export async function getNewReleasesByDateRange(startDate: Date, endDate: Date): Promise<Product[]> {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const q = query(
    productsCollection,
    where('isNewRelease', '==', true),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, 'id'>),
  }));
}

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await getDocs(productsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, 'id'>),
  }));
}

// ✅ NUEVA FUNCIÓN: obtener producto por slug (único)
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(productsCollection, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<Product, 'id'>),
  };
}
