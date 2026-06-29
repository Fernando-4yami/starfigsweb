import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase/admin"
import { getCurrentMonthDateRange, getNextMonthStartDate } from "@/lib/utils"
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_FIELDS,
} from "@/lib/api/public-product"

export const revalidate = 3600

export async function GET() {
  try {
    const collection = getDb().collection("products")
    const { start: currentStart, end: currentEnd } = getCurrentMonthDateRange()
    const nextMonthStart = getNextMonthStartDate()

    const [newlyAddedSnapshot, popularSnapshot, currentSnapshot, futureSnapshot] = await Promise.all([
      collection
        .orderBy("createdAt", "desc")
        .limit(90)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
      collection
        .where("views", ">", 0)
        .orderBy("views", "desc")
        .limit(10)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
      collection
        .where("releaseDate", ">=", currentStart)
        .where("releaseDate", "<=", currentEnd)
        .orderBy("releaseDate", "desc")
        .limit(50)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
      collection
        .where("releaseDate", ">=", nextMonthStart)
        .where("releaseDate", "<=", new Date("2100-01-01"))
        .orderBy("releaseDate", "asc")
        .limit(50)
        .select(...PUBLIC_PRODUCT_FIELDS)
        .get(),
    ])

    return NextResponse.json(
      {
        newlyAdded: newlyAddedSnapshot.docs.map(normalizePublicProduct),
        weeklyPopular: popularSnapshot.docs.map(normalizePublicProduct),
        currReleases: currentSnapshot.docs.map(normalizePublicProduct),
        futureReleases: futureSnapshot.docs.map(normalizePublicProduct),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("Error loading homepage data:", error)
    return NextResponse.json({ error: "Unable to load homepage data" }, { status: 500 })
  }
}
