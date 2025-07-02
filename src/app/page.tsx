import type { Metadata } from "next"
import ClientPage from "./ClientPage"

// 📊 Metadatos SEO optimizados
export const metadata: Metadata = {
  title: "Starfigs - Tienda de Figuras de Anime | Nendoroids, Figmas y más",
  description:
    "Descubre las mejores figuras de anime, nendoroids, figmas y coleccionables. Nuevos lanzamientos y productos populares. ¡Envío a todo el país!",
  keywords: ["figuras anime", "nendoroid", "figma", "pop up parade", "ichiban kuji", "tienda anime"],
  openGraph: {
    title: "Starfigs - Tienda de Figuras de Anime",
    description: "Las mejores figuras de anime y coleccionables",
    type: "website",
  },
}

export default function Page() {
  return <ClientPage />
}
