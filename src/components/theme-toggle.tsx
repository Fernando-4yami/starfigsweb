"use client"

import { Sun } from "lucide-react"
import { useEffect } from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  // Forzar siempre light
  useEffect(() => {
    setTheme("light")
  }, [setTheme])

  return (
    <button
      className="p-2 rounded-md border border-border bg-accent text-foreground cursor-not-allowed opacity-50"
      aria-label="Tema fijo a claro"
      disabled
    >
      <Sun className="w-5 h-5 text-yellow-500" />
    </button>
  )
}
