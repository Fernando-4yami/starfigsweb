import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"
import { generateCategoryMetadata, generateCategoryJsonLd, generateBreadcrumbJsonLd } from "@/lib/metadata"
import type { Metadata } from "next"

const config = categoryConfigs.figuarts

export const metadata: Metadata = generateCategoryMetadata(
  config.name,
  config.slug,
  config.description,
  config.badge,
)

const jsonLd = generateCategoryJsonLd(config.name, config.slug, config.description)
const breadcrumbLd = generateBreadcrumbJsonLd([
  { name: "Inicio", url: "https://starfigsperu.com" },
  { name: "Categorías", url: "https://starfigsperu.com" },
  { name: config.name },
])

export default function FiguartsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* 🌍 CONTENIDO ESTÁTICO — invisible para usuarios, visible para Google (sr-only) */}
      <section className="sr-only">
        <h1>{config.name} Originales | Starfigs Perú</h1>
        <p>{config.badge}</p>
        <p>{config.description}</p>
      </section>

      <CategoryPage config={categoryConfigs.figuarts} />
    </>
  )
}
