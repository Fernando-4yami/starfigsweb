"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Mostrar loading
    setIsLoading(true)

    // Scroll to top
    window.scrollTo(0, 0)

    // Ocultar después de un delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-white via-blue-50 to-purple-50 
                      dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 
                      flex items-center justify-center backdrop-blur-sm">
          <div className="relative">
            {/* Icono con animación */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 animate-ping-slow opacity-20">
                <Image
                  src="/iconocarga.png"
                  alt="Cargando..."
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative animate-bounce-rotate">
                <Image
                  src="/iconocarga.png"
                  alt="Cargando..."
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Círculo de progreso */}
            <div className="absolute inset-0 -m-6">
              <svg className="w-36 h-36 animate-spin-slow" viewBox="0 0 50 50">
                <circle
                  className="text-gray-200 dark:text-gray-700"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  className="text-blue-500 dark:text-blue-400"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset="25"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Partículas flotantes */}
            <div className="absolute inset-0 -m-16">
              <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-float-1 opacity-60"></div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-float-2 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-pink-500 dark:bg-pink-400 rounded-full animate-float-3 opacity-60"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-float-4 opacity-60"></div>
            </div>

            {/* Resplandor */}
            <div className="absolute inset-0 -m-12 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 
                          dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10 
                          rounded-full blur-3xl animate-pulse-slow"></div>
          </div>

          <style jsx>{`
            @keyframes bounce-rotate {
              0%, 100% {
                transform: translateY(0) rotate(0deg) scale(1);
              }
              25% {
                transform: translateY(-15px) rotate(5deg) scale(1.05);
              }
              50% {
                transform: translateY(0) rotate(0deg) scale(1);
              }
              75% {
                transform: translateY(-10px) rotate(-5deg) scale(1.05);
              }
            }

            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            @keyframes ping-slow {
              0% { transform: scale(1); opacity: 0.2; }
              50% { transform: scale(1.3); opacity: 0; }
              100% { transform: scale(1); opacity: 0.2; }
            }

            @keyframes pulse-slow {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.6; }
            }

            @keyframes float-1 {
              0%, 100% { transform: translate(0, 0); }
              33% { transform: translate(20px, -20px); }
              66% { transform: translate(-10px, 10px); }
            }

            @keyframes float-2 {
              0%, 100% { transform: translate(0, 0); }
              33% { transform: translate(-20px, 20px); }
              66% { transform: translate(10px, -10px); }
            }

            @keyframes float-3 {
              0%, 100% { transform: translate(0, 0); }
              33% { transform: translate(-15px, -15px); }
              66% { transform: translate(15px, 15px); }
            }

            @keyframes float-4 {
              0%, 100% { transform: translate(0, 0); }
              33% { transform: translate(15px, 15px); }
              66% { transform: translate(-15px, -15px); }
            }

            .animate-bounce-rotate {
              animation: bounce-rotate 2s ease-in-out infinite;
            }

            .animate-spin-slow {
              animation: spin-slow 3s linear infinite;
            }

            .animate-ping-slow {
              animation: ping-slow 2s ease-in-out infinite;
            }

            .animate-pulse-slow {
              animation: pulse-slow 3s ease-in-out infinite;
            }

            .animate-float-1 {
              animation: float-1 4s ease-in-out infinite;
            }

            .animate-float-2 {
              animation: float-2 4.5s ease-in-out infinite;
            }

            .animate-float-3 {
              animation: float-3 5s ease-in-out infinite;
            }

            .animate-float-4 {
              animation: float-4 4.2s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}
      {children}
    </>
  )
}