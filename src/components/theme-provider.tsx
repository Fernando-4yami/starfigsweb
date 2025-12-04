"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark" // ✅ DARK MODE POR DEFAULT
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}