/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← CAMBIO CRÍTICO: Activar dark mode con clase
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-amber-500',
    'hover:bg-amber-600',
    'text-red-600',
    'bg-blue-100',
    'text-blue-800',
    'disabled:opacity-60',
    'text-emerald-600', 'focus:ring-emerald-500',
    'text-blue-600', 'focus:ring-blue-500',
    'text-red-600', 'focus:ring-red-500',
    'text-orange-600', 'focus:ring-orange-500',
    'text-pink-600', 'focus:ring-pink-500',
    'text-purple-600', 'focus:ring-purple-500',
    'text-yellow-600', 'focus:ring-yellow-500',
    'text-green-600', 'focus:ring-green-500',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}