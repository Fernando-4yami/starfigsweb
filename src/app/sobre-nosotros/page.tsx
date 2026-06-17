import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "Conoce la historia de Starfigs, tu tienda peruana de figuras de anime originales importadas desde Japón. Fundada en 2022, cientos de coleccionistas felices.",
  openGraph: {
    title: "Sobre Nosotros | Starfigs Perú",
    description:
      "Conoce la historia de Starfigs, tu tienda peruana de figuras de anime originales importadas desde Japón.",
    url: "https://starfigsperu.com/sobre-nosotros",
    siteName: "Starfigs",
    locale: "es_PE",
    type: "website",
  },
}

const milestones = [
  {
    year: "2022",
    title: "Nace Starfigs",
    description:
      "Todo empezó con una hoja de cálculos, muchas ganas, y un sueño algo cuestionable: llenar el Perú de figuras de anime. Yape era nuestro método de pago principal y WhatsApp nuestra tienda física.",
    emoji: "🌱",
  },
  {
    year: "2023",
    title: "Primeros cientos de clientes",
    description:
      "De vender por WhatsApp pasamos a tener una web medio pelo, y aún así la gente confió en nosotros. Error. Quisimos hacer una pagina web, pero no sabiamos ni por donde empezar, asi que seguimos con el método tradicional.",
    emoji: "📱",
  },
  {
    year: "2024",
    title: "La web que sí funciona",
    description:
      "Después de intentos fallidos (y un par de peleas con código que no entendíamos), finalmente lanzamos Starfigs de verdad. Catálogo online, carrito de compras, y lo más importante: menos errores 404.",
    emoji: "🚀",
  },
  {
    year: "2025",
    title: "+10,000 productos y contando",
    description:
      "Miles de figuras importadas desde Japón, cientos de clientes satisfechos, y un equipo que todavía no se toma nada en serio (excepto las figuras, esas sí van en serio). Envíos a todo el Perú y una comunidad que crece cada día.",
    emoji: "🏆",
  },
]

const values = [
  {
    title: "Originales o nada",
    description:
      "No vendemos bootlegs, ni imitaciones, ni figuras que 'se ven igualito'. Si no es original, no pasa por nosotros. Punto.",
    emoji: "✅",
  },
  {
    title: "Importación directa",
    description:
      "Compramos directamente en Japón. No intermediarios, no revendedores, no 'amigo de un amigo que viaja'. Directo del fabricante a tu colección.",
    emoji: "✈️",
  },
  {
    title: "Atención que sí responde",
    description:
      "Sabemos lo que es mandar un mensaje y que te respondan 3 días después. Por eso respondemos en horario hábil por WhatsApp. Así de simple.",
    emoji: "💬",
  },
  {
    title: "Envío a todo el Perú",
    description:
      "Desde Tumbes hasta Tacna. Por Shalom (gratis en preventas), Olva, o delivery local en Arequipa. Llegamos a donde sea que estés.",
    emoji: "📦",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Starfigs es una tienda confiable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, Starfigs opera desde 2022 y cientos de coleccionistas peruanos han recibido sus figuras sin problemas. Puedes ver las reseñas de clientes en nuestro Instagram.",
      },
    },
    {
      "@type": "Question",
      name: "¿Las figuras de Starfigs son originales?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutamente. Importamos directamente desde Japón a través de distribuidores autorizados como Good Smile Company, Bandai, y tiendas oficiales. No vendemos réplicas ni bootlegs.",
      },
    },
    {
      "@type": "Question",
      name: "¿Hacen envíos a todo el Perú?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, enviamos a todo el Perú por Agencias Shalom (gratis en preventas), Olva Courier, y delivery local en Arequipa.",
      },
    },
  ],
}

export default function SobreNosotrosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="text-6xl mb-6">🏯</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Somos Starfigs
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Una tienda peruana con la misión de traerte las mejores figuras de anime 
            directamente desde Japón. Sin vueltas, sin intermediarios, y con mucho 
            cariño por el coleccionismo.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              🛒 Ver catálogo
            </Link>
            <a
              href="https://wa.me/51926951167"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:border-green-400 dark:hover:border-green-500 transition-colors"
            >
              💬 Hablar por WhatsApp
            </a>
          </div>
        </div>

        {/* Separator wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* Timeline / Historia */}
      <section className="bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
            Nuestra Historia
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-lg mx-auto">
            De cero a héroes del coleccionismo (bueno, casi).
          </p>

          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-900 transform -translate-x-1/2" />

            <div className="space-y-12">
              {milestones.map((m, i) => (
                <div key={m.year} className="relative">
                  <div className={`flex flex-col sm:flex-row items-start gap-6 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                    {/* Círculo en la línea */}
                    <div className="absolute left-4 sm:left-1/2 w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full transform -translate-x-1/2 mt-2 ring-4 ring-white dark:ring-gray-950 z-10" />

                    {/* Contenido */}
                    <div className={`ml-10 sm:ml-0 sm:w-[calc(50%-2rem)] ${i % 2 === 0 ? "sm:pr-8 sm:text-right" : "sm:pl-8"}`}>
                      <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full mb-3">
                        {m.year}
                      </div>
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{m.emoji}</span>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {m.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valores / Por qué elegirnos */}
      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
            Por qué Starfigs
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-lg mx-auto">
            No solo vendemos figuras, vendemos tranquilidad.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{v.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clientes felices - Placeholder */}
      <section className="bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🎉 Clientes Felices
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            Esto es lo que dice la gente que ya recibió sus figuras. ¿La próxima historia será la tuya?
          </p>

          {/* Placeholder - fotos de clientes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
              >
                <div className="text-center">
                  <span className="text-3xl">📸</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Cliente {i + 1}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            ¿Recibiste tu figura y quieres aparecer aquí? Mándanos tu foto por WhatsApp y la subimos 🫶
          </p>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            ✨ Unirme a los clientes felices
          </Link>
        </div>
      </section>
    </>
  )
}
