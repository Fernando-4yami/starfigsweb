import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe. Explora nuestro catálogo de figuras de anime en preventa en Perú.",
}

const categories = [
  { name: "Nendoroid", slug: "nendoroid", emoji: "😊" },
  { name: "Figma", slug: "figma", emoji: "🔧" },
  { name: "S.H.Figuarts", slug: "figuarts", emoji: "⚔️" },
  { name: "Ichiban Kuji", slug: "ichiban-kuji", emoji: "🎁" },
  { name: "Pop Up Parade", slug: "pop-up-parade", emoji: "⚡" },
  { name: "Plushies", slug: "plush", emoji: "🧸" },
  { name: "Figuras Escala", slug: "scale", emoji: "📏" },
  { name: "Figuras de Premio", slug: "pricing", emoji: "💰" },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Página no encontrada
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          La página que buscas no existe o fue movida. Pero no te preocupes, tenemos muchas figuras esperándote.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            🏠 Ir al inicio
          </Link>
          <Link
            href="/catalogo"
            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            📦 Ver catálogo
          </Link>
        </div>

        {/* Category Links */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Explora nuestras categorías
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
