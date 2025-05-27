module.exports = {
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
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/aspect-ratio')
  ]
}
