import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"
import { generateCategoryMetadata, generateCategoryJsonLd } from "@/lib/metadata"
import type { Metadata } from "next"

const config = categoryConfigs.plush

export const metadata: Metadata = generateCategoryMetadata(
  config.name,
  config.slug,
  config.description,
  config.badge,
)

const jsonLd = generateCategoryJsonLd(config.name, config.slug, config.description)

export default function PlushPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 🌍 CONTENIDO ESTÁTICO — invisible para usuarios, visible para Google (sr-only) */}
      <section className="sr-only">
        <h1>{config.name} Originales | Starfigs Perú</h1>
        <p>{config.badge}</p>
        <p>{config.description}</p>
      </section>

      <CategoryPage config={categoryConfigs.plush} />
    </>
  )
}
