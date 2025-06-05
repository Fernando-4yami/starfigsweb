import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  addDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { slugify } from '@/lib/firebase/utils/slugify';

export interface Line {
  id: string;
  name: string;
  slug: string;
  manufacturer?: string;
  description?: string;
  logo?: string;
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

export async function createLineIfNotExists(name: string, manufacturer?: string): Promise<Line> {
  const slug = slugify(name);
  const q = query(collection(db, 'lines'), where('slug', '==', slug));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Line;
  }

  const ref = await addDoc(collection(db, 'lines'), {
    name,
    slug,
    manufacturer: manufacturer || null,
    createdAt: serverTimestamp(),
  });

  const newDoc = await getDoc(ref);
  return { id: ref.id, ...newDoc.data() } as Line;
}
