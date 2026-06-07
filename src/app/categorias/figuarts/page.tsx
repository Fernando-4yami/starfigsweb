import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"
import { generateCategoryMetadata, generateCategoryJsonLd } from "@/lib/metadata"
import type { Metadata } from "next"

const config = categoryConfigs.figuarts

export const metadata: Metadata = generateCategoryMetadata(
  config.name,
  config.slug,
  config.description,
  config.badge,
)

const jsonLd = generateCategoryJsonLd(config.name, config.slug, config.description)

export default function FiguartsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPage config={categoryConfigs.figuarts} />
    </>
  )
}
