import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Condiciones de Preventa | Starfigs",
  description:
    "Conoce cómo funciona el sistema de preventas de Starfigs: reservas, tiempos de llegada, cancelaciones, envíos y métodos de pago.",
  openGraph: {
    title: "Condiciones de Preventa | Starfigs",
    description:
      "Conoce cómo funciona el sistema de preventas de Starfigs: reservas, tiempos de llegada, cancelaciones, envíos y métodos de pago.",
  },
}

const sections = [
  { id: "como-funciona", label: "¿Cómo funciona una reserva?", emoji: "💎" },
  { id: "tiempos", label: "Tiempos de llegada", emoji: "⏱️" },
  { id: "disponibilidad", label: "Disponibilidad del producto", emoji: "📦" },
  { id: "cancelaciones", label: "Cancelaciones y cambios", emoji: "🚫" },
  { id: "saldo", label: "Pago del saldo restante", emoji: "💰" },
  { id: "envios", label: "Envíos", emoji: "🚚" },
  { id: "pagos", label: "Métodos de pago", emoji: "💳" },
  { id: "contacto", label: "Contacto", emoji: "📲" },
]

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

export default function CondicionesPreventaPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Condiciones de Preventa
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Última actualización: Junio 2026
          </p>
        </div>

        {/* Prominent notice */}
        <div className="mb-10 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-200">
                Al realizar una reserva, aceptas las condiciones descritas en
                esta página.
              </p>
              <p className="mt-1 text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                Te recomendamos leer cada sección antes de hacer tu primer
                pedido.
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
          <SectionCard
            id="como-funciona"
            title="¿Cómo funciona una reserva?"
            emoji="💎"
          >
            <p>
              Starfigs trabaja mediante un sistema de{" "}
              <Highlight>preventa e importación directa desde Japón</Highlight>.
            </p>
            <p>Para reservar una figura se solicita un pago inicial:</p>
            <ul className="list-none space-y-2">
              <ListItem>
                Productos menores a <Highlight>S/200</Highlight> → reserva con{" "}
                <Highlight>S/40</Highlight>
              </ListItem>
              <ListItem>
                Productos mayores a <Highlight>S/200</Highlight> → reserva con
                el <Highlight>50%</Highlight> del valor total
              </ListItem>
            </ul>
            <p>
              El <Highlight>saldo restante</Highlight> se cancela cuando el
              producto llegue a Perú.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              Todas las figuras están sujetas a disponibilidad en Japón al
              momento de procesar el pedido.
            </p>
          </SectionCard>

          <SectionCard
            id="tiempos"
            title="Tiempos de llegada"
            emoji="⏱️"
          >
            <p>
              El tiempo estimado de llegada es de{" "}
              <Highlight>2 a 3 meses</Highlight> aproximadamente.
            </p>
            <p>
              Este plazo es referencial y puede variar debido a factores
              externos como:
            </p>
            <ul className="list-none space-y-1.5">
              <ListItem>Aduanas</ListItem>
              <ListItem>Logística internacional</ListItem>
              <ListItem>Retrasos del proveedor</ListItem>
              <ListItem>
                Cambios en la fecha de lanzamiento por parte del fabricante
              </ListItem>
            </ul>
            <p>
              Una vez que el producto llega a Perú, el envío nacional suele
              tomar entre <Highlight>2 y 5 días hábiles</Highlight> dependiendo
              del destino.
            </p>
          </SectionCard>

          <SectionCard
            id="disponibilidad"
            title="Disponibilidad del producto"
            emoji="📦"
          >
            <p>
              La disponibilidad mostrada en la web es{" "}
              <Highlight>referencial</Highlight>.
            </p>
            <p>
              Aunque una figura aparezca disponible, la reserva queda confirmada{" "}
              <Highlight>
                únicamente después de verificar stock con el proveedor en Japón
              </Highlight>
              .
            </p>
            <p>
              En caso de no existir disponibilidad, se notificará al cliente y
              cualquier pago realizado será{" "}
              <Highlight>devuelto en su totalidad</Highlight>.
            </p>
          </SectionCard>

          <SectionCard
            id="cancelaciones"
            title="Cancelaciones y cambios"
            emoji="🚫"
          >
            <p>
              Las reservas son compromisos de compra realizados específicamente
              para cada cliente.
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              Por este motivo:
            </p>
            <ul className="list-none space-y-1.5">
              <ListItem>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  No
                </span>{" "}
                se aceptan cancelaciones
              </ListItem>
              <ListItem>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  No
                </span>{" "}
                se aceptan cambios de modelo
              </ListItem>
              <ListItem>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  No
                </span>{" "}
                se aceptan cambios de personaje una vez confirmada la reserva
              </ListItem>
            </ul>
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              Al realizar el pago de reserva, el cliente acepta estas
              condiciones.
            </p>
          </SectionCard>

          <SectionCard id="saldo" title="Pago del saldo restante" emoji="💰">
            <p>
              Cuando el producto ingrese a nuestro almacén en Perú, se{" "}
              <Highlight>notificará al cliente</Highlight> para completar el
              pago pendiente.
            </p>
            <p>
              El cliente dispone de hasta{" "}
              <Highlight>30 días calendario</Highlight> para cancelar el saldo
              restante.
            </p>
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs sm:text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Si el saldo no es cancelado dentro de este plazo:
              </p>
              <ul className="list-none mt-2 space-y-1">
                <ListItem>
                  La figura podrá incorporarse al inventario de Starfigs
                </ListItem>
                <ListItem>
                  La reserva realizada{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    no será reembolsada
                  </span>
                </ListItem>
              </ul>
            </div>
          </SectionCard>

          <SectionCard id="envios" title="Envíos" emoji="🚚">
            <p className="text-base font-medium text-green-700 dark:text-green-400">
              🎁 Beneficio de preventa: envío gratuito por Agencias Shalom a
              nivel nacional.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Opciones disponibles:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
                <p className="font-semibold text-green-700 dark:text-green-400 text-sm">
                  ✅ Shalom
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Gratis · Recojo en agencia a nivel nacional
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  🚚 Olva Courier
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Costo por cotizar · Recojo en agencia o entrega a domicilio
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  🛵 Arequipa
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Delivery local: S/7
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="pagos" title="Métodos de pago" emoji="💳">
            <p>
              Los medios de pago se proporcionan{" "}
              <Highlight>
                únicamente al momento de confirmar una reserva
              </Highlight>
              .
            </p>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Métodos disponibles:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
                Yape
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-sm font-medium border border-purple-200 dark:border-purple-800">
                Plin
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700">
                Transferencia bancaria
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              * Disponibles solo en etapa de reserva confirmada
            </p>
          </SectionCard>

          <SectionCard id="contacto" title="Contacto" emoji="📲">
            <p>
              Si tienes alguna duda sobre una preventa o sobre el estado de tu
              pedido, puedes comunicarte con nosotros mediante:
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

        {/* Footer del page */}
        <div className="mt-10 text-center border-t border-gray-200 dark:border-gray-800 pt-6">
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
