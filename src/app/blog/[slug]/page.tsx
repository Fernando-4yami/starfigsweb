import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import posts, { getPostBySlug } from "@/lib/blog/posts"
import { generateBreadcrumbJsonLd } from "@/lib/metadata"

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) {
    return {
      title: "Artículo no encontrado",
      description: "El artículo de blog que buscas no está disponible.",
    }
  }

  return {
    title: post.title,
    description: post.description.slice(0, 160),
    alternates: {
      canonical: `https://starfigsperu.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description.slice(0, 160),
      url: `https://starfigsperu.com/blog/${post.slug}`,
      siteName: "Starfigs",
      locale: "es_PE",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: post.image
        ? [{ url: post.image, width: 800, height: 800, alt: post.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description.slice(0, 160),
      images: post.image ? [post.image] : [],
    },
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Starfigs",
      url: "https://starfigsperu.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://starfigsperu.com/blog/${post.slug}`,
    },
  }

  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Inicio", url: "https://starfigsperu.com" },
    { name: "Blog", url: "https://starfigsperu.com/blog" },
    { name: post.title },
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 text-xs text-gray-400 dark:text-gray-500">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Inicio</Link>
          <span className="mx-1.5">/</span>
          <Link href="/blog" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Blog</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-300 dark:text-gray-600">{post.title.slice(0, 30)}...</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
            <span>{post.category}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {post.title}
          </h1>

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {post.description}
          </p>

          {post.image && (
            <div className="mt-6 bg-gray-100 dark:bg-gray-800">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}
        </header>

        {/* Content */}
        <div className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed space-y-5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-gray-100 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-gray-100 [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:font-semibold [&_h4]:text-gray-900 dark:[&_h4]:text-gray-100 [&_h4]:mt-6 [&_h4]:mb-2 [&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100 [&_code]:text-sm [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_li]:text-gray-600 dark:[&_li]:text-gray-400 [&_li]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 dark:[&_blockquote]:border-gray-700 [&_blockquote]:pl-5 [&_blockquote]:text-gray-500 dark:[&_blockquote]:text-gray-400 [&_blockquote]:italic [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:text-gray-700 dark:[&_th]:text-gray-300 [&_th]:font-semibold [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_td]:px-4 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-gray-200 dark:[&_td]:border-gray-700 [&_tr]:last:[&_td]:border-b-0">
          <div
            dangerouslySetInnerHTML={{
              __html: post.content
                .split("\n")
                .map((line) => {
                  const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/)
                  if (imgMatch) {
                    const alt = imgMatch[1]
                    const src = imgMatch[2]
                    const caption = alt || ""
                    return `<figure class="my-8 -mx-4 sm:-mx-6 lg:-mx-8"><img src="${src}" alt="${alt}" class="w-full h-auto" loading="lazy" />${caption ? `<figcaption class="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">${caption}</figcaption>` : ""}</figure>`
                  }
                  if (line.startsWith("---")) return `<hr class="my-10 border-gray-200 dark:border-gray-800" />`
                  if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`
                  if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`
                  if (line.startsWith("#### ")) return `<h4>${line.slice(5)}</h4>`
                  if (line.trim() === "") return ""
                  if (line.startsWith("|")) {
                    if (line.match(/^\|[\s:-]+\|[\s:-]+/)) return ""
                    const cells = line.split("|").filter((c) => c.trim()).map((c) => c.trim())
                    return `<tr>${cells.map((c) => `<td>${c.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</td>`).join("")}</tr>`
                  }
                  if (line.startsWith("- ")) {
                    return `<li>${line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</li>`
                  }
                  if (line.match(/^\d+\.\s/)) {
                    const content = line.replace(/^\d+\.\s/, "")
                    return `<li>${content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</li>`
                  }
                  let formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`([^`]+)`/g, "<code>$1</code>")
                  return `<p>${formatted}</p>`
                })
                .join("\n")
                .replace(/(<tr>.*?<\/tr>\n?)+/g, '<div class="overflow-x-auto my-4"><table class="min-w-full border border-gray-200 dark:border-gray-700"><tbody>$&</tbody></table></div>')
                .replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul class="my-3">$1</ul>'),
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Link href="/blog" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            ← Volver al blog
          </Link>
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </div>
  )
}
