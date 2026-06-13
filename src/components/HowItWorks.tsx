"use client"

import { Search, MessageCircle, ShieldCheck, DollarSign, Package, Truck, ClipboardCheck } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "1. Encuentra tu figura",
    description: "Explora nuestro catálogo y encuentra la figura que quieres importar desde Japón.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    icon: MessageCircle,
    title: "2. Solicita la compra",
    description: "Contáctanos por WhatsApp con el producto que te interesa para iniciar el proceso.",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    icon: ShieldCheck,
    title: "3. Verificamos disponibilidad",
    description: "Confirmamos con nuestro proveedor en Japón si el producto está disponible y el precio actual.",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    icon: DollarSign,
    title: "4. Te confirmamos el precio",
    description: "Te enviamos el precio final confirmado sin sorpresas. Si aceptas, pasamos a la reserva.",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    icon: ClipboardCheck,
    title: "5. Realizas la reserva",
    description:
      "Productos menores a S/200 reservas con S/40. Productos mayores a S/200 reservas con el 50%. El saldo se cancela cuando el producto llegue a Perú.",
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  {
    icon: Package,
    title: "6. Compramos en Japón",
    description:
      "Con tu reserva confirmada, adquirimos la figura en Japón. Tiempo estimado de llegada: 2 a 3 meses (vía marítima).",
    color: "from-sky-500 to-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  {
    icon: Truck,
    title: "7. Recibe tu figura",
    description:
      "Cuando la figura llega a Perú, pagas el saldo restante y coordinamos el envío: Shalom (GRATIS, recojo en agencia), Olva Courier (por cotizar) o delivery local en Arequipa (S/7).",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
  },
]

export default function HowItWorks() {
  return (
    <section id="proceso-reserva" className="mb-12 lg:mb-0">
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Proceso de reserva
        </h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Somos un servicio de importación y pre-venta de figuras originales desde Japón.
          Así de fácil es reservar la figura que quieres:
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon

          return (
            <div
              key={index}
              className={`${step.bgColor} ${step.borderColor} border p-4 shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 shrink-0 bg-gradient-to-br ${step.color} text-white`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5">{step.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Badges informativos al final */}
      <div className="mt-8 grid grid-cols-1 gap-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">100%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Productos originales, nuevos y sellados</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">2-3 meses</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Tiempo estimado de llegada desde Japón</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">🚛 Gratis</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Envío gratis por Agencias Shalom a todo el Perú</p>
        </div>
      </div>
    </section>
  )
}
