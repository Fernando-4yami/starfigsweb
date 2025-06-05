import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { slugify } from '@/lib/firebase/utils/slugify';

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description?: string;
}

export interface Line {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// --- GETTERS ---

export async function getManufacturers(): Promise<Manufacturer[]> {
  try {
    const q = query(collection(db, 'manufacturers'), orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Manufacturer[];
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return [];
  }
}

export async function getManufacturerBySlug(slug: string): Promise<Manufacturer> {
  try {
    const q = query(collection(db, 'manufacturers'), where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error(`Fabricante "${slug}" no encontrado`);

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Manufacturer;
  } catch (error) {
    console.error(`Error fetching manufacturer ${slug}:`, error);
    throw error;
  }
}

export async function getLines(): Promise<Line[]> {
  try {
    const q = query(collection(db, 'lines'), orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Line[];
  } catch (error) {
    console.error('Error fetching lines:', error);
    return [];
  }
}

export async function getLineBySlug(slug: string): Promise<Line> {
  try {
    const q = query(collection(db, 'lines'), where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error(`Línea "${slug}" no encontrada`);

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Line;
  } catch (error) {
    console.error(`Error fetching line ${slug}:`, error);
    throw error;
  }
}

// --- CREATORS ---

export async function createManufacturerIfNotExists(name: string): Promise<Manufacturer> {
  const slug = slugify(name);

  try {
    const existing = await getManufacturerBySlug(slug);
    return existing;
  } catch {
    const newDoc = await addDoc(collection(db, 'manufacturers'), {
      name,
      slug,
      logo: '', // Puedes permitir agregar logo luego
      description: '',
      createdAt: serverTimestamp(),
    });

    return {
      id: newDoc.id,
      name,
      slug,
      logo: '',
      description: '',
    };
  }
}

export async function createLineIfNotExists(name: string): Promise<Line> {
  const slug = slugify(name);

  try {
    const existing = await getLineBySlug(slug);
    return existing;
  } catch {
    const newDoc = await addDoc(collection(db, 'lines'), {
      name,
      slug,
      description: '',
      createdAt: serverTimestamp(),
    });

    return {
      id: newDoc.id,
      name,
      slug,
      description: '',
    };
  }
}
