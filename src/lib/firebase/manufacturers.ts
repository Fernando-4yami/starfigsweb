import { db } from "./firebase"
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  getDocs,
} from "firebase/firestore"

import { slugify, normalizeText } from "@/lib/utils"

export interface Manufacturer {
  id?: string
  name: string
  slug: string
  logo?: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

const manufacturerConverter = {
  toFirestore(manufacturer: Manufacturer): DocumentData {
    return {
      name: manufacturer.name,
      slug: manufacturer.slug,
      logo: manufacturer.logo || "",
      description: manufacturer.description || "",
      createdAt: manufacturer.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Manufacturer {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      description: data.description,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  },
}

export const addManufacturer = async (manufacturer: Omit<Manufacturer, "id">) => {
  try {
    const manufacturersRef = collection(db, "manufacturers").withConverter(manufacturerConverter)
    const newManufacturerDoc = doc(manufacturersRef)

    const slug = slugify(manufacturer.name)
    const normalizedName = normalizeText(manufacturer.name)

    await setDoc(newManufacturerDoc, {
      ...manufacturer,
      slug: slug,
      name: normalizedName,
    })

    return { id: newManufacturerDoc.id, ...manufacturer }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getManufacturers = async () => {
  try {
    const manufacturersRef = collection(db, "manufacturers").withConverter(manufacturerConverter)
    const q = query(manufacturersRef, orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const manufacturers = querySnapshot.docs.map((doc) => doc.data())
    return manufacturers
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getManufacturer = async (slug: string) => {
  try {
    const manufacturersRef = collection(db, "manufacturers").withConverter(manufacturerConverter)
    const q = query(manufacturersRef, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const manufacturer = querySnapshot.docs[0].data()
    return manufacturer
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// 🆕 FUNCIÓN FALTANTE: createManufacturerIfNotExists
export const createManufacturerIfNotExists = async (name: string): Promise<Manufacturer> => {
  try {
    const normalizedName = normalizeText(name)
    const slug = slugify(normalizedName)

    // Buscar si ya existe
    const existingManufacturer = await getManufacturer(slug)
    if (existingManufacturer) {
      return existingManufacturer
    }

    // Si no existe, crear nuevo fabricante
    const newManufacturer: Omit<Manufacturer, "id"> = {
      name: normalizedName,
      slug: slug,
      logo: "",
      description: "",
    }

    const result = await addManufacturer(newManufacturer)
    return {
      id: result.id,
      name: result.name,
      slug: slug,
      logo: "",
      description: "",
    }
  } catch (error: any) {
    console.error("Error creating manufacturer:", error)
    throw new Error(`Failed to create manufacturer: ${error.message}`)
  }
}
