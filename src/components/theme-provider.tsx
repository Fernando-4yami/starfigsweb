"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light" // ✅ LIGHT MODE POR DEFAULT (usuario puede cambiar, se guarda)
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}