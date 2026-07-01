import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe o fue movida.",
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Página no encontrada
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          La página que buscas no existe o fue movida. Pero no te preocupes, tenemos muchas figuras esperándote.
        </p>

        <div className="flex justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
