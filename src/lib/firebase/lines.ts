import { db } from "@/lib/firebase/firebase"
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

export interface Line {
  id?: string
  name: string
  slug: string
  description: string
  createdAt?: Date
  updatedAt?: Date
}

const lineConverter = {
  toFirestore(line: Line): DocumentData {
    return {
      name: line.name,
      slug: line.slug,
      description: line.description,
      createdAt: line.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Line {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  },
}

export const addLine = async (line: Omit<Line, "id">) => {
  try {
    const linesRef = collection(db, "lines").withConverter(lineConverter)
    const newLineDoc = doc(linesRef)

    const slug = slugify(line.name)
    const normalizedName = normalizeText(line.name)

    await setDoc(newLineDoc, {
      ...line,
      slug: slug,
      name: normalizedName,
    })

    return { id: newLineDoc.id, ...line }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getLines = async () => {
  try {
    const linesRef = collection(db, "lines").withConverter(lineConverter)
    const q = query(linesRef, orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const lines = querySnapshot.docs.map((doc) => doc.data())
    return lines
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getLine = async (slug: string) => {
  try {
    const linesRef = collection(db, "lines").withConverter(lineConverter)
    const q = query(linesRef, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const line = querySnapshot.docs[0].data()
    return line
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// 🆕 FUNCIÓN FALTANTE: createLineIfNotExists
export const createLineIfNotExists = async (name: string, manufacturerName?: string): Promise<Line> => {
  try {
    const normalizedName = normalizeText(name)
    const slug = slugify(normalizedName)

    // Buscar si ya existe
    const existingLine = await getLine(slug)
    if (existingLine) {
      return existingLine
    }

    // Si no existe, crear nueva línea
    const newLine: Omit<Line, "id"> = {
      name: normalizedName,
      slug: slug,
      description: manufacturerName ? `Línea de ${manufacturerName}` : "",
    }

    const result = await addLine(newLine)
    return {
      id: result.id,
      name: result.name,
      slug: slug,
      description: newLine.description,
    }
  } catch (error: any) {
    console.error("Error creating line:", error)
    throw new Error(`Failed to create line: ${error.message}`)
  }
}
