import type { Metadata } from "next"
import CatalogoClient from "./CatalogoClient"

export const metadata: Metadata = {
  title: "Catálogo de Figuras Anime en Perú",
  description:
    "Explora nuestro catálogo completo de figuras de anime en preventa en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji, Pop Up Parade y más. Envío gratis.",
  alternates: {
    canonical: "https://starfigsperu.com/catalogo",
  },
  openGraph: {
    title: "Catálogo de Figuras Anime en Perú",
    description:
      "Explora nuestro catálogo completo de figuras de anime en preventa en Perú. Envío gratis.",
    url: "https://starfigsperu.com/catalogo",
    siteName: "Starfigs Perú",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo de Figuras Anime en Perú",
    description:
      "Explora nuestro catálogo completo de figuras de anime en preventa en Perú.",
  },
}

import { categoryConfigs } from "@/config/categories"
import { generateBreadcrumbJsonLd } from "@/lib/metadata"
import Link from "next/link"

export default function CatalogoPage() {
  const categories = Object.values(categoryConfigs)

  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Inicio", url: "https://starfigsperu.com" },
    { name: "Catálogo" },
  ])

  return (
    <>
      {/* 🍞 Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* 🌍 CONTENIDO ESTÁTICO — invisible para usuarios, visible para Google (sr-only) */}
      <section className="sr-only">
        <h1>Catálogo Completo de Figuras Anime</h1>
        <p>Explora todas nuestras figuras de anime en preventa. Contamos con más de 10,000 productos originales importados de Japón. Envío gratis a todo el Perú.</p>
        <nav>
          <ul>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categorias/${cat.slug}`}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* 🚀 CLIENTE — carga dinámica de productos */}
      <CatalogoClient />
    </>
  )
}
