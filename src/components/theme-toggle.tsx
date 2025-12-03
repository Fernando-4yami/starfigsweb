"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 🔧 Evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md border border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 cursor-wait"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5 animate-pulse bg-gray-300 dark:bg-gray-600 rounded" />
      </button>
    )
  }

  // 🎯 Obtener tema actual (considerando 'system')
  const currentTheme = theme === 'system' ? systemTheme : theme

  const handleToggle = () => {
    console.log('🌙 Toggle clicked! Current theme:', theme)
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    console.log('🌙 Setting theme to:', newTheme)
    setTheme(newTheme)
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      className="relative p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 
                 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700
                 transition-colors duration-200 cursor-pointer z-50"
      aria-label="Toggle theme"
      title={`Cambiar a modo ${currentTheme === 'dark' ? 'claro' : 'oscuro'}`}
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  )
}