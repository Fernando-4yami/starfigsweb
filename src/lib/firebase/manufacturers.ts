import { db } from "./firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description?: string;
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  try {
    const q = query(collection(db, "manufacturers"), orderBy("name"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Manufacturer[];

  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    return [];
  }
}

export async function getManufacturerBySlug(slug: string): Promise<Manufacturer> {
  try {
    const q = query(collection(db, "manufacturers"), where("slug", "==", slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error(`Fabricante "${slug}" no encontrado`);

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Manufacturer;

  } catch (error) {
    console.error(`Error fetching manufacturer ${slug}:`, error);
    throw error;
  }
}
