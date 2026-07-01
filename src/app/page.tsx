import HomePage from "@/app/ClientPage"
import { getNewReleases } from "@/lib/firebase/products"
import { categoryConfigs } from "@/config/categories"
import { generateOrganizationJsonLd } from "@/lib/metadata"
import Link from "next/link"
import type { Product } from "@/lib/firebase/products"

// 🌍 SERVER COMPONENT: Google ve este contenido aunque JS no se ejecute

export default async function Page() {
  // Pre-fetch productos en el servidor para que Google los vea
  let initialProducts: Product[] = []
  try {
    initialProducts = await getNewReleases(18)
  } catch (err) {
    console.error("Error pre-fetching homepage products:", err)
  }

  const categories = Object.values(categoryConfigs)

  const organizationJsonLd = generateOrganizationJsonLd()

  return (
    <>
      {/* 🏢 JSON-LD Organización para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* 🌍 HERO ESTÁTICO — invisible para usuarios, visible para Google (sr-only) */}
      <section className="sr-only">
        <h1>Figuras de Anime Originales — Starfigs Perú</h1>
        <p>Figuras de anime coleccionables importadas de Japón. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji, Pop Up Parade y escalas. Envío gratis a todo el Perú por Agencias Shalom.</p>
        <nav>
          <ul>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categorias/${cat.slug}`}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav>
          <p>Más contenido:</p>
          <ul>
            <li><Link href="/blog">Blog de Figuras de Anime</Link></li>
          </ul>
        </nav>
      </section>

      {/* El cliente conserva estos productos para evitar reemplazar el LCP al hidratar. */}
      <HomePage initialProducts={initialProducts} />
    </>
  )
}
