import HomePage from "@/app/ClientPage"
import { getNewReleases } from "@/lib/firebase/products"
import { categoryConfigs } from "@/config/categories"
import Link from "next/link"
import type { Product } from "@/lib/firebase/products"

// 🌍 SERVER COMPONENT: Google ve este contenido aunque JS no se ejecute

export default async function Page() {
  // Pre-fetch productos en el servidor para que Google los vea
  let initialProducts: Product[] = []
  try {
    initialProducts = await getNewReleases(12)
  } catch (err) {
    console.error("Error pre-fetching homepage products:", err)
  }

  const categories = Object.values(categoryConfigs)

  return (
    <>
      {/* 🌍 HERO ESTÁTICO — invisible para usuarios, visible para Google (sr-only) */}
      <section className="sr-only">
        <h1>Figuras de Anime en Preventa — Perú</h1>
        <p>Las mejores figuras originales importadas de Japón. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji y más. Envío gratis a todo el Perú por Agencias Shalom.</p>
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

      {/* 🚀 CLIENTE — hidrata y reemplaza los productos estáticos con datos dinámicos */}
      <HomePage initialProducts={initialProducts} />
    </>
  )
}
