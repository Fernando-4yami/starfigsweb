"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Mostrar loading cuando cambia la ruta
    setIsLoading(true)

    // Ocultar después de un delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[99999] bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="relative">
        {/* Icono con animación de bounce y rotate */}
        <div className="relative w-24 h-24 animate-bounce-slow">
          <Image
            src="/iconocarga.png"
            alt="Cargando..."
            fill
            className="object-contain animate-spin-slow"
            priority
          />
        </div>

        {/* Círculo de carga alrededor */}
        <div className="absolute inset-0 -m-4">
          <svg className="w-32 h-32 animate-spin" viewBox="0 0 50 50">
            <circle
              className="opacity-25"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <circle
              className="text-blue-500 dark:text-blue-400"
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="80"
              strokeDashoffset="60"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Texto de carga */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">
            Cargando...
          </p>
        </div>

        {/* Efecto de resplandor */}
        <div className="absolute inset-0 -m-8 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  )
}