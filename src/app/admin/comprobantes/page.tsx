"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/auth-client"
import { generateVoucherPdf, type VoucherData, type ProductoItem } from "@/lib/generate-voucher-pdf"

// Contador de pedidos en localStorage
const PEDIDO_KEY = "starfigs-pedido-counter"

function leerUltimoPedido(): number {
  if (typeof window === "undefined") return 927
  const stored = localStorage.getItem(PEDIDO_KEY)
  return stored ? parseInt(stored, 10) : 927
}

function guardarUltimoPedido(num: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PEDIDO_KEY, String(num))
}

function formatearPedido(num: number): string {
  return `AT${String(num).padStart(4, "0")}`
}

const PEDIDO_INICIAL = leerUltimoPedido() + 1

// Cargar el logo en base64 una sola vez
let logoBase64Promise: Promise<string | undefined> | null = null
function getLogoBase64(): Promise<string | undefined> {
  if (!logoBase64Promise) {
    logoBase64Promise = (async () => {
      try {
        const resp = await fetch("/logo_starfigs.jpg")
        const blob = await resp.blob()
        return new Promise<string | undefined>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      } catch {
        return undefined
      }
    })()
  }
  return logoBase64Promise
}

function nuevoProductoVacio(): ProductoItem {
  return { nombre: "", tipo: "Figura", origen: "Producto Original Importado de Japon" }
}

export default function ComprobantesPage() {
  const router = useRouter()
  const [user, loading] = useAuthState(auth)
  const [ultimoPedidoUsado, setUltimoPedidoUsado] = useState(PEDIDO_INICIAL)

  const [formData, setFormData] = useState<VoucherData>({
    pedido: formatearPedido(PEDIDO_INICIAL),
    productos: [nuevoProductoVacio()],
    cliente: "",
    dni: "",
    telefono: "",
    llegada: "",
    precio: 0,
    reserva: 0,
  })

  const handleChange = (field: keyof VoucherData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProductChange = (index: number, field: keyof ProductoItem, value: string) => {
    setFormData((prev) => {
      const prods = [...prev.productos]
      prods[index] = { ...prods[index], [field]: value }
      return { ...prev, productos: prods }
    })
  }

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, nuevoProductoVacio()],
    }))
  }

  const removeProduct = (index: number) => {
    if (formData.productos.length <= 1) return
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index),
    }))
  }

  const handleGenerate = async () => {
    if (!formData.productos[0]?.nombre || !formData.cliente || !formData.dni) {
      alert("Producto, Cliente y DNI son obligatorios")
      return
    }

    try {
      const logoBase64 = await getLogoBase64()
      const doc = generateVoucherPdf(formData, logoBase64)

      // Guardar el contador solo cuando se genera exitosamente
      guardarUltimoPedido(ultimoPedidoUsado)

      // Generar nombre de archivo
      const primerProd = formData.productos[0].nombre
      const slug = primerProd
        .split("-")[0]
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 30)
      const filename = `${formData.pedido}_${slug}.pdf`

      doc.save(filename)
    } catch (err) {
      console.error("Error generando PDF:", err)
      alert("Error al generar el PDF. Revisa la consola.")
    }
  }

  const handleGenerateNewPedido = () => {
    const nuevoNum = ultimoPedidoUsado + 1
    setUltimoPedidoUsado(nuevoNum)
    setFormData({
      pedido: formatearPedido(nuevoNum),
      productos: [nuevoProductoVacio()],
      cliente: "",
      dni: "",
      telefono: "",
      llegada: "",
      precio: 0,
      reserva: 0,
    })
  }

  const saldo = formData.precio - formData.reserva
  const cantProductos = formData.productos.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    router.push("/admin/login")
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 sm:py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Comprobante de Reserva
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Genera un PDF para entregar al cliente
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Cabecera del pedido */}
          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Pedido</p>
                <p className="text-white text-2xl font-bold">{formData.pedido || "AT####"}</p>
              </div>
              <button
                onClick={handleGenerateNewPedido}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                title="Generar nuevo numero de pedido"
              >
                Nuevo
              </button>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6 space-y-5">
            {/* Productos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Productos <span className="text-red-500">*</span>
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({cantProductos})</span>
                </label>
                <button
                  onClick={addProduct}
                  className="text-sm bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-lg font-medium transition-colors"
                >
                  Agregar producto
                </button>
              </div>

              <div className="space-y-3">
                {formData.productos.map((prod, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Producto #{i + 1}
                      </span>
                      {cantProductos > 1 && (
                        <button
                          onClick={() => removeProduct(i)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={prod.nombre}
                      onChange={(e) => handleProductChange(i, "nombre", e.target.value)}
                      placeholder="Nombre del producto"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm mb-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={prod.tipo}
                        onChange={(e) => handleProductChange(i, "tipo", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="Figura">Figura</option>
                        <option value="Nendoroid">Nendoroid</option>
                        <option value="Figma">Figma</option>
                        <option value="Scale">Scale</option>
                        <option value="Pop Up Parade">Pop Up Parade</option>
                        <option value="Ichiban Kuji">Ichiban Kuji</option>
                        <option value="Plush">Plush</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <input
                        type="text"
                        value={prod.origen}
                        onChange={(e) => handleProductChange(i, "origen", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cliente}
                onChange={(e) => handleChange("cliente", e.target.value)}
                placeholder="Nombre completo del cliente"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* DNI y Telefono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => handleChange("dni", e.target.value)}
                  placeholder="Ej: 73140480"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Telefono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="Ej: 946 501 675"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Llegada */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Llegada Estimada
              </label>
              <input
                type="text"
                value={formData.llegada}
                onChange={(e) => handleChange("llegada", e.target.value)}
                placeholder="Ej: Agosto-Septiembre 2026"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Precios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Precio Total (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio || ""}
                  onChange={(e) => handleChange("precio", parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 99.00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Monto Reserva (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reserva || ""}
                  onChange={(e) => handleChange("reserva", parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 40.00"
                  max={formData.precio || 0}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Resumen automatico */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Resumen</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {cantProductos} producto{cantProductos !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formData.productos.filter(p => p.nombre).length} con nombre
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Precio Total</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    S/ {(formData.precio || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Monto Abonado</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    - S/ {(formData.reserva || 0).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200">Saldo Pendiente</span>
                  <span className={`font-bold text-lg ${saldo > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    S/ {Math.max(0, saldo).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Boton Generar */}
            <button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold py-3.5 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Generar PDF</span>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Tips</h3>
          <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
            <li>Haz clic en <strong>Agregar producto</strong> para anadir mas items</li>
            <li>El numero de pedido se genera automaticamente</li>
            <li>El saldo pendiente se calcula solo</li>
            <li>El PDF se descarga automaticamente al hacer clic en Generar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
