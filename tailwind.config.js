/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false, // <--- desactiva dark mode completamente
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
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}
