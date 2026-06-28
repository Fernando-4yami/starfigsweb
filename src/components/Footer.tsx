"use client"

import { CreditCard, Facebook, MessageCircle, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" prefetch={false} className="block">
              <Image
                src="/starfigs.webp"
                alt="Starfigs"
                width={200}
                height={36}
                className="mx-auto h-auto w-auto max-w-[200px]"
                sizes="200px"
              />
            </Link>

            <p className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Figuras originales de anime importadas desde Japon. Preventas,
              encargos y envios a todo el Peru.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Link
                href="https://www.facebook.com/starfigss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm text-white transition-colors duration-200 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-label="Siguenos en Facebook"
              >
                <Facebook className="h-4 w-4" />
                <span className="text-xs font-medium">Facebook</span>
              </Link>
              <a
                href="https://wa.me/51926951167"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-600 px-4 py-2 text-sm text-white transition-colors duration-200 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                aria-label="Contactanos por WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs font-medium">WhatsApp</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <Link href="/blog" className="transition-colors hover:text-gray-700 dark:hover:text-gray-200">
                Blog
              </Link>
              <Link href="/politica-privacidad" className="transition-colors hover:text-gray-700 dark:hover:text-gray-200">
                Politica de Privacidad
              </Link>
              <Link href="/eliminacion-datos" className="transition-colors hover:text-gray-700 dark:hover:text-gray-200">
                Eliminacion de Datos
              </Link>
              <Link href="/condiciones-preventa" className="transition-colors hover:text-gray-700 dark:hover:text-gray-200">
                Condiciones de Preventa
              </Link>
              <Link href="/politica-devoluciones" className="transition-colors hover:text-gray-700 dark:hover:text-gray-200">
                Politica de Cambios y Devoluciones
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
              Envios
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Envio gratis por Shalom en preventas seleccionadas.</p>
              <p>Olva Courier disponible segun cotizacion.</p>
              <p>Delivery local en Arequipa.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Reservas
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Desde S/40 para productos menores a S/200.</p>
              <p>50% para productos mayores a S/200.</p>
              <p>Saldo pendiente al llegar el producto a Peru.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Metodos de pago
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                Yape
              </span>
              <span className="inline-flex items-center border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-400">
                Plin
              </span>
              <span className="inline-flex items-center border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Transferencia bancaria
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              Tiempo estimado de llegada: 2 a 3 meses. Los plazos pueden variar
              por factores logisticos, aduaneros o del fabricante.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Starfigs
          </p>
        </div>
      </div>
    </footer>
  )
}
