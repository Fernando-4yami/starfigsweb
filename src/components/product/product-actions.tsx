"use client"
import { Clock, CheckCircle, Info, Ban, AlertTriangle, Lock, Wallet } from "lucide-react"
import { isReleasedOverAMonth } from "@/lib/serialize-product"

interface ProductActionsProps {
  whatsappUrl: string
  onWhatsAppClick: () => void
  releaseDate?: any
  price?: number
}

// 🚀 ICONO REAL DE WHATSAPP
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
)

// 🔧 FUNCIÓN PARA PARSEAR FECHA
const parseReleaseDate = (releaseDate: any): Date | null => {
  if (!releaseDate) return null

  // Si es Timestamp de Firestore
  if (releaseDate.toDate && typeof releaseDate.toDate === "function") {
    return releaseDate.toDate()
  }

  // Si es objeto con seconds (serializado)
  if (releaseDate.seconds) {
    return new Date(releaseDate.seconds * 1000)
  }

  // Si es string o number
  return new Date(releaseDate)
}

export default function ProductActions({ whatsappUrl, onWhatsAppClick, releaseDate, price }: ProductActionsProps) {
  const now = new Date()

  // 🔧 PARSEAR FECHA AQUÍ
  const parsedReleaseDate = parseReleaseDate(releaseDate)

  const isAvailable =
    parsedReleaseDate &&
    (parsedReleaseDate.getFullYear() < now.getFullYear() ||
      (parsedReleaseDate.getFullYear() === now.getFullYear() && parsedReleaseDate.getMonth() <= now.getMonth()))

  const isOldRelease = isReleasedOverAMonth({ releaseDate: parsedReleaseDate })

  const handleWhatsAppClick = () => {
    onWhatsAppClick() // Para tracking
    window.open(whatsappUrl, "_blank") // Abrir WhatsApp directamente
  }

  const getButtonText = () => {
    // Si es lanzamiento anterior, igual pueden consultar
    if (isOldRelease) {
      return "Consultar disponibilidad"
    }
    // Todos los productos siguen el mismo flujo de importación/pre-venta
    return "Solicitar / Reservar por WhatsApp"
  }

  return (
    <div className="space-y-4">
      {/* 🚀 BOTÓN CON TEXTO DINÁMICO SEGÚN DISPONIBILIDAD Y STOCK */}
      <button
        onClick={handleWhatsAppClick}
        className={`w-full font-semibold py-4 px-6 flex items-center justify-center gap-3 
                   transition-all duration-200 shadow-lg ${
          isOldRelease
            ? "bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white"
            : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white hover:shadow-xl transform hover:-translate-y-0.5"
        }`}
      >
        <WhatsAppIcon className="w-5 h-5" />
        {getButtonText()}
      </button>

      {!isOldRelease && (
        <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Sujeto a disponibilidad en Japón</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Confirmación en 24 horas</span>
          </div>

        </div>
      )}

      {isOldRelease ? (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 
                        bg-slate-50 dark:bg-slate-950/30 px-4 py-2 border border-slate-200 dark:border-slate-900">
          <Ban className="w-4 h-4" />
          <span className="text-sm font-medium">Lanzamiento anterior - Consulta disponibilidad</span>
        </div>
      ) : isAvailable ? (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 
                        bg-green-50 dark:bg-green-950/30 px-4 py-2 border border-green-200 dark:border-green-900">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Disponible para reserva</span>
        </div>
      ) : parsedReleaseDate ? (
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 
                        bg-purple-50 dark:bg-purple-950/30 px-4 py-2 border border-purple-200 dark:border-purple-900">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Pre-venta - Próximo lanzamiento</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 
                        bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border border-blue-200 dark:border-blue-900">
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">Consulta disponibilidad y precio</span>
        </div>
      )}

      {/* 💳 INFO DE RESERVA Y PAGOS */}
      {!isOldRelease && price !== undefined && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Reserva</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed ml-9">
            {price < 200
              ? "Productos menores a S/200 → reserva con S/40"
              : "Productos mayores a S/200 → reserva con el 50% del valor total"
            }
            . El saldo se cancela cuando el producto llegue a Perú.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Pagos</span>
          </div>
          <div className="flex flex-wrap gap-2 ml-9">
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
          <p className="text-xs text-gray-500 dark:text-gray-500 italic ml-9">
            * Disponibles solo en etapa de reserva confirmada
          </p>
        </div>
      )}
    </div>
  )
}