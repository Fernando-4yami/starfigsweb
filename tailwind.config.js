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
    extend: {},
  },
  plugins: [
    require('@tailwindcss/aspect-ratio')
  ]
}
