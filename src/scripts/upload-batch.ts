// src/scripts/upload-batch.ts
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Usando el alias @
import productsData from "../../products.json"; // Asegúrate de tener este archivo

interface Product {
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  brand: string;
  stock?: number;
}

async function uploadBatch() {
  try {
    console.log("🚀 Iniciando carga masiva de productos...");

    for (const product of productsData) {
      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
        stock: product.stock || 0 // Valor por defecto
      });
      console.log(`✅ ${product.name} agregado (ID: ${docRef.id})`);
    }

    console.log("🎉 ¡Todos los productos se subieron correctamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la carga:", error);
    process.exit(1);
  }
}

uploadBatch();