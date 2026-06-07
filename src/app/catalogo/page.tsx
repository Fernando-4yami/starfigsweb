import type { Metadata } from "next"
import CatalogoClient from "./CatalogoClient"

export const metadata: Metadata = {
  title: "Catálogo de Figuras Anime en Perú | Starfigs",
  description:
    "Explora nuestro catálogo completo de figuras de anime en preventa en Perú. Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji, Pop Up Parade y más. Envío gratis.",
  alternates: {
    canonical: "https://starfigsperu.com/catalogo",
  },
  openGraph: {
    title: "Catálogo de Figuras Anime en Perú | Starfigs",
    description:
      "Explora nuestro catálogo completo de figuras de anime en preventa en Perú. Envío gratis.",
    url: "https://starfigsperu.com/catalogo",
    siteName: "Starfigs Perú",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo de Figuras Anime en Perú | Starfigs",
    description:
      "Explora nuestro catálogo completo de figuras de anime en preventa en Perú.",
  },
}

export default function CatalogoPage() {
  return <CatalogoClient />
}
