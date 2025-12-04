"use client"

import { Facebook } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Redes Sociales */}
          <div className="flex items-center gap-4">
            <Link
              href="https://www.facebook.com/starfigss"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg 
                       transition-colors duration-200 shadow-md hover:shadow-lg"
              aria-label="Síguenos en Facebook"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-sm font-medium">Síguenos en Facebook</span>
            </Link>
          </div>

          {/* Información */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tienda especializada en figuras de anime y coleccionables
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} Starfigs. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}