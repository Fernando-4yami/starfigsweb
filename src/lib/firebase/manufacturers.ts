import { db } from "./firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

interface Manufacturer {
  id: string;
  name: string;
  slug: string; // Ej: 'bandai-spirits'
  logo: string;
  description?: string; // Campo opcional
}

// Obtener TODOS los fabricantes (para el listado)
export async function getManufacturers(): Promise<Manufacturer[]> {
  try {
    const q = query(
      collection(db, "manufacturers"),
      orderBy("name") // Orden alfabético
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug,
      logo: doc.data().logo,
      description: doc.data().description
    }));
    
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    return [];
  }
}

// Obtener UN fabricante por su slug (para páginas individuales)
export async function getManufacturerBySlug(slug: string): Promise<Manufacturer> {
  try {
    const q = query(
      collection(db, "manufacturers"),
      where("slug", "==", slug) // Búsqueda exacta
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Fabricante "${slug}" no encontrado`);
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug,
      logo: doc.data().logo,
      description: doc.data().description
    };
    
  } catch (error) {
    console.error(`Error fetching manufacturer ${slug}:`, error);
    throw error; // Puedes personalizar el error
  }
}