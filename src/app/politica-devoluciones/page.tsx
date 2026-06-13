import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Cambios y Devoluciones | Starfigs",
  description:
    "Conoce la política de cambios y devoluciones de Starfigs. Requisitos para reclamos, defectos de fabricación y procedimiento para solicitar cambios.",
  openGraph: {
    title: "Política de Cambios y Devoluciones | Starfigs",
    description:
      "Conoce la política de cambios y devoluciones de Starfigs. Requisitos para reclamos, defectos de fabricación y procedimiento para solicitar cambios.",
  },
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

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm">
      {children}
    </div>
  )
}

const sections = [
  { id: "introduccion", label: "Introducción", emoji: "📋" },
  { id: "casos-aceptados", label: "¿Cuándo aceptamos reclamos?", emoji: "✅" },
  { id: "requisitos", label: "Requisitos para presentar un reclamo", emoji: "📹" },
  { id: "danios-envio", label: "Daños durante el envío", emoji: "📦" },
  { id: "consideraciones", label: "Consideraciones importantes", emoji: "⚠️" },
  { id: "proceso", label: "Proceso de evaluación", emoji: "🔍" },
  { id: "contacto", label: "Contacto", emoji: "📲" },
]

export default function PoliticaDevolucionesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Política de Cambios y Devoluciones
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Última actualización: Junio 2025
          </p>
        </div>

        {/* Aviso importante */}
        <div className="mb-10 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-200">
                Al realizar una compra o reserva, aceptas los términos de esta política.
              </p>
              <p className="mt-1 text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                Te recomendamos leer cada sección antes de hacer tu primer pedido.
              </p>
            </div>
          </div>
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

        {/* Secciones */}
        <div className="space-y-6">
          {/* Introducción */}
          <SectionCard id="introduccion" title="Introducción" emoji="📋">
            <p>
              En Starfigs trabajamos con <Highlight>importación directa desde Japón</Highlight> de figuras
              coleccionables, preventas y artículos importados. Debido a la naturaleza de nuestros productos,
              contamos con una política de cambios y devoluciones clara y justa tanto para el cliente como
              para nosotros.
            </p>
            <p>
              <Highlight>No aceptamos devoluciones</Highlight> por cambio de opinión, gustos personales,
              errores del cliente al realizar el pedido o retrasos ajenos a Starfigs.
            </p>
            <p>
              Sin embargo, si tu producto presenta algún inconveniente genuino, estamos aquí para ayudarte.
              A continuación detallamos los casos en los que puedes presentar un reclamo y cómo hacerlo.
            </p>
          </SectionCard>

          {/* Casos aceptados */}
          <SectionCard id="casos-aceptados" title="¿Cuándo aceptamos reclamos?" emoji="✅">
            <p>Solo se aceptarán reclamos en los siguientes casos:</p>
            <ul className="list-none space-y-2">
              <ListItem>
                El producto recibido es <Highlight>diferente al producto solicitado</Highlight>
              </ListItem>
              <ListItem>
                Se envió un <Highlight>producto incorrecto</Highlight> por error de Starfigs
              </ListItem>
              <ListItem>
                El producto presenta un <Highlight>defecto de fabricación considerable</Highlight> que
                afecte significativamente su apariencia o funcionalidad
              </ListItem>
            </ul>
          </SectionCard>

          {/* Requisitos */}
          <SectionCard id="requisitos" title="Requisitos para presentar un reclamo" emoji="📹">
            <p>
              Para que un reclamo pueda ser evaluado, el cliente deberá proporcionar la siguiente evidencia:
            </p>
            <ul className="list-none space-y-2">
              <ListItem>
                Un <Highlight>video continuo y sin cortes</Highlight> de la apertura del paquete
              </ListItem>
              <ListItem>
                El video debe mostrar claramente el <Highlight>embalaje externo</Highlight> antes de ser abierto
              </ListItem>
              <ListItem>
                El video debe registrar <Highlight>todo el proceso de desempaque</Highlight> hasta mostrar
                el producto y el inconveniente reportado
              </ListItem>
              <ListItem>
                Fotografías adicionales podrán ser solicitadas de ser necesario
              </ListItem>
            </ul>
            <WarningBox>
              <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                ⚠️ Importante
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                Sin el video de apertura solicitado, no será posible evaluar el reclamo. Este requisito
                nos permite verificar que el producto no fue dañado durante la apertura por parte del cliente.
              </p>
            </WarningBox>
          </SectionCard>

          {/* Daños durante el envío */}
          <SectionCard id="danios-envio" title="Daños durante el envío" emoji="📦">
            <p>
              Si el cliente observa que el paquete presenta signos de <Highlight>daño, manipulación,
              apertura previa, aplastamiento</Highlight> o cualquier otra anomalía visible al momento
              de la recepción, se recomienda grabar un <Highlight>video continuo y sin cortes</Highlight>
              desde antes de abrir el paquete hasta finalizar el desempaque.
            </p>
            <p>
              Esta evidencia podrá ser requerida por Starfigs o por la empresa transportista para la
              evaluación de reclamos relacionados con daños ocurridos durante el envío.
            </p>
            <WarningBox>
              <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                📦 Recomendación
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                Siempre revisa el estado del paquete antes de firmar la recepción. Si ves algún daño
                evidente, haz una nota en la guía de entrega y notifícalo de inmediato.
              </p>
            </WarningBox>
          </SectionCard>

          {/* Consideraciones */}
          <SectionCard id="consideraciones" title="Consideraciones importantes" emoji="⚠️">
            <ul className="list-none space-y-3">
              <ListItem>
                <Highlight>Pequeñas imperfecciones de pintura, empaque o acabado</Highlight> consideradas
                normales por el fabricante <strong>no serán consideradas defectos de fabricación</strong>.
                Las figuras japonesas pueden presentar detalles mínimos que están dentro de los estándares
                de calidad del fabricante.
              </ListItem>
              <ListItem>
                No se aceptarán reclamos que <Highlight>no cuenten con evidencia suficiente</Highlight>
              </ListItem>
              <ListItem>
                Cada caso será <Highlight>evaluado individualmente</Highlight> por Starfigs
              </ListItem>
              <ListItem>
                Los gastos de envío para devoluciones aprobadas serán cubiertos por Starfigs siempre que
                el reclamo sea válido
              </ListItem>
            </ul>

            <WarningBox>
              <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                💡 Tip
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                Siempre recomendamos grabar el unboxing de tus pedidos, incluso si no esperas ningún
                problema. Es la mejor manera de proteger tu compra y facilitar cualquier reclamo.
              </p>
            </WarningBox>
          </SectionCard>

          {/* Proceso */}
          <SectionCard id="proceso" title="Proceso de evaluación" emoji="🔍">
            <ol className="list-none space-y-3">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center mt-0.5">1</span>
                <span>Contacta con nosotros por <Highlight>WhatsApp</Highlight> dentro de las <Highlight>48 horas</Highlight> de recibido el producto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center mt-0.5">2</span>
                <span>Envía el <Highlight>video de apertura</Highlight> y las fotos que te solicitemos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center mt-0.5">3</span>
                <span>Starfigs evaluará el caso y te dará una respuesta en un plazo <Highlight>máximo de 7 días hábiles</Highlight></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center mt-0.5">4</span>
                <span>Si el reclamo es aprobado, coordinamos el <Highlight>cambio del producto o el reembolso</Highlight> según corresponda</span>
              </li>
            </ol>
          </SectionCard>

          {/* Contacto */}
          <SectionCard id="contacto" title="Contacto" emoji="📲">
            <p>
              Si tienes alguna duda sobre nuestra política de cambios y devoluciones, puedes
              comunicarte con nosotros mediante:
            </p>
            <ul className="list-none space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <span>
                  WhatsApp:{" "}
                  <a
                    href="https://wa.me/51926951167"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline font-medium"
                  >
                    926 951 167
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">👍</span>
                <span>
                  Facebook:{" "}
                  <a
                    href="https://www.facebook.com/starfigss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Starfigs
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <span>
                  Sitio web:{" "}
                  <a
                    href="https://starfigsperu.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    starfigsperu.com
                  </a>
                </span>
              </li>
            </ul>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center border-t border-gray-200 dark:border-gray-800 pt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Al realizar una compra o reserva en Starfigs, aceptas los términos descritos en esta política.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
