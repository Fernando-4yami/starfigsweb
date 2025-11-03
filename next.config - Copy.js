/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["firebasestorage.googleapis.com", "www.tsoto.net", "storage.googleapis.com"],
    unoptimized: true, // ✅ Mantenemos esto como solicitaste
  },

  // 🚀 Optimizaciones de performance
  experimental: {
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
        // Cache estático para imágenes
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

  // 🚀 Compresión
  compress: true,

  // 🔧 Configuración de build
  poweredByHeader: false,

  // 🚀 Optimización de bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimizar bundle del cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
