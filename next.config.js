/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌐 URL base para redes sociales (Open Graph)
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://starfigsperu.com",
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "www.tsoto.net",
      "storage.googleapis.com",
      "jumpichiban.com",
      "www.jumpichiban.com",
    ],
    unoptimized: true,
  },

  // 🚀 Optimizaciones de performance
  experimental: {
    serverActions: true, // ← CAMBIO: en Next.js 13 es booleano
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  // 🔧 Headers de seguridad y performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: "/images/:path*",
        destination: "/api/images/:path*",
      },
    ]
  },

  compress: true,
  poweredByHeader: false,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
