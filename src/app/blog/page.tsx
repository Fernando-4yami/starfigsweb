import type { Metadata } from "next"
import Link from "next/link"
import posts from "@/lib/blog/posts"

export const metadata: Metadata = {
  title: "Blog de Figuras de Anime | Starfigs Perú",
  description:
    "Guías y consejos sobre figuras de anime originales en Perú. Aprende a identificar originales, descubre los mejores formatos y consejos para tu colección.",
  openGraph: {
    title: "Blog de Figuras de Anime | Starfigs Perú",
    description:
      "Guías y consejos sobre figuras de anime originales en Perú.",
    url: "https://starfigsperu.com/blog",
    siteName: "Starfigs",
    locale: "es_PE",
    type: "website",
  },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Blog
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Guías y consejos sobre figuras de anime en Perú.
          </p>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block"
            >
              <article className="flex gap-4 sm:gap-6 border-b border-gray-200 dark:border-gray-800 pb-6">
                {post.image && (
                  <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {post.category}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <time className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(post.date).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>

                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-2">
                    {post.title}
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              name: "Blog de Figuras de Anime | Starfigs Perú",
              description:
                "Guías y consejos sobre figuras de anime originales en Perú.",
              url: "https://starfigsperu.com/blog",
              publisher: {
                "@type": "Organization",
                name: "Starfigs",
                url: "https://starfigsperu.com",
              },
            }),
          }}
        />
      </div>
    </div>
  )
}
