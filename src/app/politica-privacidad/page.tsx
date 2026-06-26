import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Politica de Privacidad",
  description:
    "Politica de privacidad de Starfigs Peru para el sitio web y herramientas de publicacion en redes sociales.",
  alternates: {
    canonical: "https://starfigsperu.com/politica-privacidad",
  },
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </section>
  )
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
            Politica de Privacidad
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Ultima actualizacion: Junio 2026
          </p>
        </header>

        <div className="space-y-6">
          <Section title="Responsable">
            <p>
              Starfigs Peru opera el sitio web starfigsperu.com y sus canales
              oficiales de comunicacion. Para consultas sobre privacidad puedes
              escribirnos a{" "}
              <a
                href="mailto:starfigss@starfigsperu.com"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                starfigss@starfigsperu.com
              </a>
              .
            </p>
          </Section>

          <Section title="Informacion que recopilamos">
            <p>
              Podemos recopilar datos proporcionados por el cliente al realizar
              consultas, reservas o compras, como nombre, correo electronico,
              telefono, direccion de envio, comprobantes de pago y mensajes de
              atencion.
            </p>
            <p>
              Tambien podemos recopilar informacion tecnica basica del sitio,
              como cookies, analitica de navegacion y datos necesarios para
              mejorar la experiencia de compra.
            </p>
          </Section>

          <Section title="Uso de la informacion">
            <p>
              Usamos la informacion para atender consultas, gestionar pedidos,
              coordinar pagos y envios, confirmar reservas, brindar soporte y
              mejorar nuestros servicios.
            </p>
            <p>
              Las herramientas conectadas con Meta/Facebook se usan para
              administrar publicaciones de productos de Starfigs en sus propias
              paginas y perfiles comerciales autorizados.
            </p>
          </Section>

          <Section title="Publicaciones y redes sociales">
            <p>
              Si se usa una integracion con Facebook, Instagram o Threads, la
              aplicacion solo publica contenido autorizado por Starfigs, como
              imagenes, textos y enlaces de productos. No vendemos ni cedemos
              datos personales de clientes a terceros.
            </p>
          </Section>

          <Section title="Conservacion y seguridad">
            <p>
              Conservamos la informacion solo durante el tiempo necesario para
              cumplir fines comerciales, legales, contables o de soporte. Usamos
              medidas razonables para proteger la informacion contra accesos no
              autorizados.
            </p>
          </Section>

          <Section title="Derechos del usuario">
            <p>
              Puedes solicitar acceso, correccion o eliminacion de tus datos
              personales escribiendo a starfigss@starfigsperu.com. Revisaremos tu
              solicitud y responderemos por el mismo canal de contacto.
            </p>
            <p>
              Tambien puedes revisar nuestras instrucciones especificas de
              eliminacion de datos en{" "}
              <Link
                href="/eliminacion-datos"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Eliminacion de datos
              </Link>
              .
            </p>
          </Section>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center dark:border-gray-800">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
