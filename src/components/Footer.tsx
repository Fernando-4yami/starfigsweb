"use client"

import { Facebook, Truck, CreditCard, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1: Starfigs */}
          <div className="space-y-4">
            <Link href="/" className="block">
              <Image
                src="/starfigs-logo.png"
                alt="Starfigs"
                width={200}
                height={54}
                className="mx-auto h-auto w-auto max-w-[200px]"
                priority
              />
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center">
              Figuras originales de anime importadas desde Japón. Preventas, encargos y envíos a todo el Perú.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="https://www.facebook.com/starfigss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors duration-200 text-sm"
                aria-label="Síguenos en Facebook"
              >
                <Facebook className="w-4 h-4" />
                <span className="text-xs font-medium">Facebook</span>
              </Link>
              <a
                href="https://wa.me/51926951167"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white transition-colors duration-200 text-sm"
                aria-label="Contáctanos por WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">WhatsApp</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <Link href="/blog" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Blog
              </Link>
              <Link href="/guia-de-compra" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Guía de Compra
              </Link>
              <Link href="/sobre-nosotros" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Sobre Nosotros
              </Link>
              <Link href="/condiciones-preventa" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Condiciones de Preventa
              </Link>
              <Link href="/politica-devoluciones" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Política de Cambios y Devoluciones
              </Link>
            </div>
          </div>

          {/* Columna 2: Envíos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600 dark:text-green-400" />
              Envíos
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>🎁 Envío gratis por Shalom en preventas seleccionadas.</p>
              <p>🚚 Olva Courier disponible según cotización.</p>
              <p>🛵 Delivery local en Arequipa.</p>
            </div>
          </div>

          {/* Columna 3: Reservas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Reservas
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Desde S/40 para productos menores a S/200.</p>
              <p>50% para productos mayores a S/200.</p>
              <p>Saldo pendiente al llegar el producto a Perú.</p>
            </div>
          </div>

          {/* Columna 4: Métodos de pago */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Métodos de pago
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800">
                Yape
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-medium border border-purple-200 dark:border-purple-800">
                Plin
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-700">
                Transferencia bancaria
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Tiempo estimado de llegada: 2 a 3 meses. Los plazos pueden variar por factores logísticos, aduaneros o del fabricante.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Starfigs
          </p>
        </div>
      </div>
    </footer>
  )
}