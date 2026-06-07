import HomePage from "@/app/ClientPage"
import { getNewReleases } from "@/lib/firebase/products"
import { categoryConfigs } from "@/config/categories"
import Link from "next/link"
import type { Product } from "@/lib/firebase/products"

// 🌍 SERVER COMPONENT: Google ve este contenido aunque JS no se ejecute

export default async function Page() {
  // Pre-fetch productos en el servidor para que Google los vea
  let initialProducts: Product[] = []
  try {
    initialProducts = await getNewReleases(12)
  } catch (err) {
    console.error("Error pre-fetching homepage products:", err)
  }

  const categories = Object.values(categoryConfigs)

  return (
    <>
      {/* 🌍 HERO ESTÁTICO — visible para Google */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Figuras de Anime en Preventa — Perú
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Las mejores figuras originales importadas de Japón. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji y más.
            Envío gratis a todo el Perú por Agencias Shalom.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="px-5 py-2.5 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 
                         border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 
                         dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>      </div>
    </section>

      {/* 🚀 CLIENTE — hidrata y reemplaza los productos estáticos con datos dinámicos */}
      <HomePage initialProducts={initialProducts} />
    </>
  )
}
