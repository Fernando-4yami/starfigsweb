import type { Metadata } from "next"
import CatalogoClient from "./CatalogoClient"

export const metadata: Metadata = {
  title: "Catálogo de Figuras Anime en Perú | Starfigs",
  description:
    "Explora nuestro catálogo completo de figuras de anime en preventa en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji, Pop Up Parade y más. Envío gratis.",
  alternates: {
    canonical: "https://starfigsperu.com/catalogo",
  },
  openGraph: {
    title: "Catálogo de Figuras Anime en Perú | Starfigs",
    description:
      "Explora nuestro catálogo completo de figuras de anime en preventa en Perú. Envío gratis.",
    url: "https://starfigsperu.com/catalogo",
    siteName: "Starfigs Perú",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo de Figuras Anime en Perú | Starfigs",
    description:
      "Explora nuestro catálogo completo de figuras de anime en preventa en Perú.",
  },
}

import { categoryConfigs } from "@/config/categories"
import Link from "next/link"

export default function CatalogoPage() {
  const categories = Object.values(categoryConfigs)

  return (
    <>
      {/* 🌍 CONTENIDO ESTÁTICO — visible para Google */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Catálogo Completo de Figuras Anime
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Explora todas nuestras figuras de anime en preventa. Contamos con más de 10,000 productos
            originales importados de Japón. Envío gratis a todo el Perú.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 
                         border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 
                         hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CLIENTE — carga dinámica de productos */}
      <CatalogoClient />
    </>
  )
}
