import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Eliminacion de Datos",
  description:
    "Instrucciones para solicitar la eliminacion de datos personales asociados a Starfigs Peru.",
  alternates: {
    canonical: "https://starfigsperu.com/eliminacion-datos",
  },
}

function Step({
  number,
  children,
}: {
  number: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        {number}
      </span>
      <span className="text-sm leading-6 text-gray-600 dark:text-gray-400">
        {children}
      </span>
    </li>
  )
}

export default function EliminacionDatosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
            Eliminacion de Datos de Usuario
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Ultima actualizacion: Junio 2026
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="space-y-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
            <p>
              Si deseas solicitar la eliminacion de datos personales asociados a
              Starfigs Peru, puedes hacerlo enviandonos una solicitud directa.
            </p>
            <p>
              Esta pagina tambien aplica a datos relacionados con integraciones
              de Meta/Facebook, Instagram o Threads usadas por Starfigs para
              administrar publicaciones comerciales autorizadas.
            </p>
          </div>

          <ol className="mt-6 space-y-4">
            <Step number="1">
              Envia un correo a{" "}
              <a
                href="mailto:starfigss@starfigsperu.com"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                starfigss@starfigsperu.com
              </a>{" "}
              con el asunto "Solicitud de eliminacion de datos".
            </Step>
            <Step number="2">
              Incluye tu nombre, correo o telefono usado para contactarnos, y
              una breve descripcion de la informacion que deseas eliminar.
            </Step>
            <Step number="3">
              Validaremos la solicitud y eliminaremos o anonimizaremos la
              informacion que no sea necesaria por obligaciones legales,
              contables, antifraude o de soporte pendiente.
            </Step>
            <Step number="4">
              Te enviaremos una confirmacion cuando la solicitud haya sido
              atendida.
            </Step>
          </ol>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Tiempo estimado de respuesta: hasta 15 dias habiles desde la
            recepcion de la solicitud.
          </div>
        </section>

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
