import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"
import { generateCategoryMetadata, generateCategoryJsonLd } from "@/lib/metadata"
import type { Metadata } from "next"

const config = categoryConfigs.ichiban

export const metadata: Metadata = generateCategoryMetadata(
  config.name,
  config.slug,
  config.description,
  config.badge,
)

const jsonLd = generateCategoryJsonLd(config.name, config.slug, config.description)

export default function IchibanKujiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 🌍 CONTENIDO ESTÁTICO — visible para Google */}
      <section className="bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-rose-800 dark:text-rose-200 mb-3">
            {config.name} en Preventa Perú
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
            {config.badge}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>
      </section>

      <CategoryPage config={categoryConfigs.ichiban} />
    </>
  )
}
