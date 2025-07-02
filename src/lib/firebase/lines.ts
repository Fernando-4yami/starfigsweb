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
} from "firebase/firestore"

import { slugify } from "@/lib/utils"
import { normalizeText as normalizeProductLine } from "@/lib/utils"

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
    const normalizedName = normalizeProductLine(line.name)

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

    // TODO: Fix this any
    const querySnapshot: any = await getDocs(q)

    const lines = querySnapshot.docs.map((doc: any) => doc.data())
    return lines
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getLine = async (slug: string) => {
  try {
    const linesRef = collection(db, "lines").withConverter(lineConverter)
    const q = query(linesRef, where("slug", "==", slug))
    // TODO: Fix this any
    const querySnapshot: any = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const line = querySnapshot.docs[0].data()
    return line
  } catch (error: any) {
    throw new Error(error.message)
  }
}

import { getDocs } from "firebase/firestore"
