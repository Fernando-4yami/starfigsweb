"use client"

import { Facebook, Truck, ShieldCheck, CreditCard, MessageCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1: Sobre Starfigs */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-400">Starfigs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Servicio de importación y pre-venta de figuras originales desde Japón.
              Productos 100% originales, nuevos y sellados.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="https://www.facebook.com/starfigss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                         dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
                aria-label="Síguenos en Facebook"
              >
                <Facebook className="w-4 h-4" />
                <span className="text-xs font-medium">Facebook</span>
              </Link>
              <a
                href="https://wa.me/51926951167"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                         dark:bg-green-500 dark:hover:bg-green-600 text-white transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
                aria-label="Contáctanos por WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Envíos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
              Envíos
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-green-700 dark:text-green-400">🎁 Envío gratis a todo el Perú</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Por Agencias Shalom - Sin mínimo de compra</p>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-green-700 dark:text-green-400 shrink-0">✅ Shalom:</span>
                  <span>GRATIS - Recojo en agencia (nivel nacional)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0">🚚 Olva Courier:</span>
                  <span>Por cotizar - Recojo en agencia o delivery a domicilio</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0">🛵 Local AQP:</span>
                  <span>S/7 - Delivery en Arequipa</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                Tiempo de llegada desde Japón: 2 a 3 meses aprox. (vía marítima).
                Una vez en Perú, el envío local tarda 2 a 5 días hábiles.
              </p>
            </div>
          </div>

          {/* Columna 3: Políticas */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Políticas
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>No se admiten cancelaciones ni cambios de modelo una vez efectuada la reserva.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Plazo máximo de 30 días desde el ingreso a almacén para cancelar el saldo restante.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>En caso de no cancelar el saldo a tiempo, la figura se incorpora al inventario sin reembolso de la reserva.</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 italic pt-2">
                Al realizar una reserva, aceptas estos términos.
              </p>
            </div>
          </div>

          {/* Columna 4: Pagos y Reserva */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Pagos y Reserva
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="space-y-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">💰 Montos de reserva</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Productos menores a S/200 → reserva con <strong>S/40</strong></li>
                  <li>Productos mayores a S/200 → reserva con el <strong>50%</strong> del valor total</li>
                </ul>
                <p className="text-xs text-gray-500">El saldo se cancela cuando el producto llegue a Perú.</p>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">💳 Métodos de pago</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800">
                    Yape
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-medium border border-purple-200 dark:border-purple-800">
                    Plin
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-700">
                    Transferencia bancaria
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2">
                  * Disponibles solo en etapa de reserva confirmada
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Starfigs — Servicio de importación de figuras coleccionables desde Japón. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}