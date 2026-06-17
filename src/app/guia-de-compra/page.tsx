import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Guía de Compra",
  description:
    "Aprende cómo comprar figuras de anime en Starfigs: proceso paso a paso, métodos de pago, opciones de envío, reservas y tiempos de entrega. Tu guía completa para coleccionar en Perú.",
  openGraph: {
    title: "Guía de Compra | Starfigs Perú",
    description:
      "Aprende cómo comprar figuras de anime en Starfigs: proceso paso a paso, métodos de pago, opciones de envío, reservas y tiempos de entrega.",
    url: "https://starfigsperu.com/guia-de-compra",
    siteName: "Starfigs",
    locale: "es_PE",
    type: "website",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cómo comprar figuras anime en Starfigs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Solo tienes que navegar el catálogo, agregar productos al carrito, elegir tu método de entrega (envío a domicilio, recojo en agencia o entrega personal), seleccionar el método de pago (Yape, Plin o transferencia), y subir tu comprobante. Te notificaremos cuando llegue a Perú.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto cuesta el envío de figuras anime a Perú?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El envío por Agencias Shalom es gratis para preventas seleccionadas. Olva Courier tiene un costo por cotizar. El delivery local en Arequipa cuesta S/7. Para envío a domicilio en Lima es S/9 y a provincias S/15.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto tarda en llegar una figura de anime desde Japón?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Para figuras en stock, el envío nacional toma 2 a 5 días hábiles. Para preventas, el tiempo estimado es de 2 a 3 meses desde el cierre de preventa, ya que la figura debe fabricarse y enviarse desde Japón.",
      },
    },
  ],
}

function SectionCard({
  id,
  title,
  emoji,
  children,
}: {
  id: string
  title: string
  emoji: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          {title}
        </h2>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </section>
  )
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 before:content-['•'] before:text-blue-500 before:font-bold before:text-lg before:leading-none before:mt-0.5">
      <span>{children}</span>
    </li>
  )
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold text-blue-700 dark:text-blue-400">
      {children}
    </span>
  )
}

const sections = [
  { id: "paso-a-paso", label: "Paso a paso", emoji: "🛒" },

  { id: "envios", label: "Opciones de envío", emoji: "📦" },
  { id: "pagos", label: "Métodos de pago", emoji: "💳" },
  { id: "reservas", label: "Reservas y preventas", emoji: "💰" },
  { id: "tiempos", label: "Tiempos de entrega", emoji: "⏱️" },
  { id: "consejos", label: "Consejos útiles", emoji: "💡" },
]

export default function GuiaDeCompraPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="text-5xl mb-4">🛍️</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Guía de Compra
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Todo lo que necesitas saber para comprar figuras de anime en Starfigs, 
              desde el primer clic hasta que la figura está en tus manos.
            </p>
          </div>

          {/* Índice */}
          <nav
            aria-label="Índice de secciones"
            className="mb-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Índice
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-150"
                  >
                    <span className="text-lg shrink-0">{s.emoji}</span>
                    <span>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contenido */}
          <div className="space-y-6">
            {/* Paso a paso */}
            <SectionCard id="paso-a-paso" title="¿Cómo comprar paso a paso?" emoji="🛒">
              <p>Comprar en Starfigs es más fácil que armar un Figma sin manual (bueno, casi).</p>

              <div className="space-y-4 mt-4">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Navega el catálogo</p>
                    <p className="text-sm">Explora nuestras categorías: Nendoroid, Figma, S.H.Figuarts, Ichiban Kuji, Pop Up Parade, Escala, Figuras de Premio, Plushies y más.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">2</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Elige tu figura</p>
                    <p className="text-sm">Revisa las imágenes, descripción, precio y disponibilidad. Si es preventa, verás la fecha estimada de lanzamiento.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">3</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Agrega al carrito</p>
                    <p className="text-sm">Selecciona la cantidad y agrega al carrito. Puedes seguir comprando o ir al checkout directamente.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">4</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Elige tu método de entrega</p>
                    <p className="text-sm">Puedes elegir entre envío a domicilio, recojo en agencia (Olva o Shalom), entrega personal en Arequipa, o almacenar para acumular pedidos.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">5</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Realiza el pago</p>
                    <p className="text-sm">Elige Yape, Plin o transferencia bancaria. Una vez realizado, sube tu comprobante en "Mis pedidos".</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">6</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Espera la notificación</p>
                    <p className="text-sm">Te avisaremos por WhatsApp cuando la figura llegue a Perú. Una vez aquí, la enviamos o coordinamos la entrega.</p>
                  </div>
                </div>
              </div>
            </SectionCard>



            {/* Envíos */}
            <SectionCard id="envios" title="Opciones de envío" emoji="📦">
              <p className="text-base font-medium text-green-700 dark:text-green-400">
                🎁 Envío gratis por Shalom en preventas seleccionadas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
                  <p className="font-semibold text-green-700 dark:text-green-400 text-sm">✅ Shalom</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Gratis · Recojo en agencia a nivel nacional</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">🚚 Olva Courier</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Costo por cotizar · Recojo en agencia o delivery</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">🛵 Arequipa</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Delivery local: S/7</p>
                </div>
              </div>


            </SectionCard>

            {/* Pagos */}
            <SectionCard id="pagos" title="Métodos de pago" emoji="💳">
              <p>Aceptamos los métodos de pago más usados en Perú:</p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
                  Yape
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-sm font-medium border border-purple-200 dark:border-purple-800">
                  Plin
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700">
                  Transferencia BCP / Interbank
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800">
                  Mercado Pago (tarjetas)
                </span>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-4">
                Los datos de pago se proporcionan al momento de confirmar el pedido. Nunca guardamos información de tarjetas.
              </p>
            </SectionCard>

            {/* Reservas */}
            <SectionCard id="reservas" title="Reservas y preventas" emoji="💰">
              <p>Starfigs trabaja con un sistema de <Highlight>preventa e importación directa desde Japón</Highlight>.</p>

              <div className="space-y-3 mt-3">
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Productos menores a S/200</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Reserva con <Highlight>S/40</Highlight></p>
                </div>
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Productos mayores a S/200</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Reserva con el <Highlight>50%</Highlight> del valor total</p>
                </div>
              </div>

              <p className="text-sm mt-3">
                El <Highlight>saldo restante</Highlight> se cancela cuando el producto llega a Perú. Tienes hasta <Highlight>45 días</Highlight> para completar el pago.
              </p>

              <Link
                href="/condiciones-preventa"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Ver condiciones completas de preventa →
              </Link>
            </SectionCard>

            {/* Tiempos */}
            <SectionCard id="tiempos" title="Tiempos de entrega" emoji="⏱️">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Productos en stock</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Envío en 2 a 5 días hábiles después de confirmar el pago.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                  <span className="text-xl">✈️</span>
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Preventas (importación desde Japón)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">2 a 3 meses aproximadamente. El plazo puede variar por factores logísticos, aduaneros o cambios en la fecha de lanzamiento del fabricante.</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Consejos */}
            <SectionCard id="consejos" title="Consejos útiles" emoji="💡">
              <ul className="list-none space-y-3">
                <ListItem>
                  <Highlight>Siempre graba el unboxing</Highlight> — Si algo sale mal, el video es tu mejor respaldo para un reclamo.
                </ListItem>
                <ListItem>
                  <Highlight>Revisa las medidas</Highlight> — Las figuras tienen altura en cm especificada. Una Nendoroid mide ~10cm, una escala 1/7 puede medir ~25cm.
                </ListItem>
                <ListItem>
                  <Highlight>Preventa = mejor precio</Highlight> — Comprar en preventa suele ser más barato que esperar a que la figura salga y se agote.
                </ListItem>
                <ListItem>
                  <Highlight>Síguenos en Instagram</Highlight> — Publicamos novedades, ofertas y subastas semanales. No te pierdas ninguna.
                </ListItem>
                <ListItem>
                  <Highlight>Acumula pedidos</Highlight> — Si tienes varias preventas, puedes elegir "Almacenar" y enviar todo junto para ahorrar en envíos.
                </ListItem>
              </ul>
            </SectionCard>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              ¿Sigues con dudas? Escríbenos por WhatsApp y te ayudamos al toque.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://wa.me/51926951167"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
              >
                💬 WhatsApp 926 951 167
              </a>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                🛒 Ir al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
