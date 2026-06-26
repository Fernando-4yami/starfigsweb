"use client"

import { useState, useEffect, useCallback } from "react"
import JSZip from "jszip"
import { updateProduct } from "@/lib/firebase/products"
import { getAdminAuthHeaders } from "@/lib/api/admin-client"

// ──────────────── Types ────────────────

interface SocialProduct {
  id: string
  slug?: string
  name: string
  price: number
  releaseDate?: Date | string | null
  imageUrls?: string[]
  thumbnailUrl?: string
  brand?: string
  category?: string
}

interface Props {
  product: SocialProduct | null
  isOpen: boolean
  onClose: () => void
}

// ──────────────── Helpers ────────────────

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const convertBlobToJpeg = async (blob: Blob): Promise<Blob> => {
  if (blob.type === "image/jpeg") return blob
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("No se pudo crear el canvas")); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error("Error al convertir a JPEG"))
      }, "image/jpeg", 0.95)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Error al cargar la imagen"))
    }
    img.src = URL.createObjectURL(blob)
  })
}

// ──────────────── Component ────────────────

export default function SocialPublisherModal({ product, isOpen, onClose }: Props) {
  // ── Image selection ──
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const selectAll = () => {
    if (!product?.imageUrls) return
    setSelectedIndices(new Set(product.imageUrls.map((_, i) => i)))
  }
  const deselectAll = () => setSelectedIndices(new Set())
  const toggleImage = (idx: number) =>
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  // ── Editable fields ──
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState(0)
  const [editMonth, setEditMonth] = useState("")
  const [editYear, setEditYear] = useState("")

  // ── Posting state ──
  const [postingFB, setPostingFB] = useState(false)
  const [postingIG, setPostingIG] = useState(false)
  const [fbStatus, setFbStatus] = useState<"idle" | "success" | "error">("idle")
  const [igStatus, setIgStatus] = useState<"idle" | "success" | "error">("idle")
  const [fbError, setFbError] = useState("")
  const [igError, setIgError] = useState("")
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<"success" | "error" | null>(null)

  // ── Settings (saved to localStorage) ──
  const [fbPageId, setFbPageId] = useState("")
  const [fbAccessToken, setFbAccessToken] = useState("")
  const [igAccountId, setIgAccountId] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Initialize from product
  useEffect(() => {
    if (!product || !isOpen) return
    setEditName(product.name || "")
    setEditPrice(product.price || 0)
    if (product.releaseDate) {
      const d = product.releaseDate instanceof Date ? product.releaseDate : new Date(product.releaseDate)
      if (!isNaN(d.getTime())) {
        setEditMonth(String(d.getMonth()))
        setEditYear(String(d.getFullYear()))
      } else {
        setEditMonth("")
        setEditYear("")
      }
    } else {
      setEditMonth("")
      setEditYear("")
    }
    selectAll()
    setFbStatus("idle")
    setIgStatus("idle")
    setFbError("")
    setIgError("")
    setCopied(false)
    setSavedMsg(null)
  }, [product, isOpen])

  // Load settings from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return
    setFbPageId(localStorage.getItem("starfigs-fb-page-id") || "")
    setFbAccessToken(localStorage.getItem("starfigs-fb-token") || "")
    setIgAccountId(localStorage.getItem("starfigs-ig-account-id") || "")
  }, [isOpen])

  const saveSettings = () => {
    localStorage.setItem("starfigs-fb-page-id", fbPageId)
    localStorage.setItem("starfigs-fb-token", fbAccessToken)
    localStorage.setItem("starfigs-ig-account-id", igAccountId)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  // ── Template generation ──
  const generateTemplate = useCallback(() => {
    const baseUrl = "https://starfigsperu.com"
    const slug = product?.slug || product?.id || ""
    const productUrl = `${baseUrl}/products/${slug}`
    const month = editMonth && MONTHS_ES[parseInt(editMonth)]
    const year = editYear
    const dateStr = month && year ? `${month} ${year}` : "Por confirmar"

    return [
      "⭐🇯🇵 PREVENTA / BAJO PEDIDO",
      "",
      editName,
      "",
      "",
      `🗓️ Lanzamiento: ${dateStr} `,
      "",
      "🌟 Más detalles: ",
      productUrl,
      "",
      "🎁 Envío gratis por Shalom a agencia como beneficio de preventa",
      "🚢 Llegada estimada: 2-3 meses después del lanzamiento",
      "",
      "🇯🇵 Producto ORIGINAL y SELLADO",
    ].join("\n")
  }, [editName, editMonth, editYear, product?.slug, product?.id])

  const template = generateTemplate()

  // ── Copy ──
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = template
      ta.style.position = "fixed"
      ta.style.left = "-999999px"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Download selected images ──
  const [downloading, setDownloading] = useState(false)
  const handleDownload = async () => {
    const images = product?.imageUrls?.filter((_, i) => selectedIndices.has(i)) || []
    if (images.length === 0) return
    setDownloading(true)
    const zip = new JSZip()
    const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "producto"

    for (let i = 0; i < images.length; i++) {
      try {
        const resp = await fetch(images[i])
        const blob = await resp.blob()
        zip.file(`${slug}_${i + 1}.jpg`, await convertBlobToJpeg(blob))
      } catch (err) {
        console.error(`Error en imagen ${i + 1}:`, err)
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(zipBlob)
    link.download = `${slug}.zip`
    link.click()
    URL.revokeObjectURL(link.href)
    setDownloading(false)
  }

  // ── Save to Firebase ──
  const handleSave = async () => {
    if (!product?.id) return
    setSaving(true)
    setSavedMsg(null)
    try {
      const month = editMonth ? parseInt(editMonth) : undefined
      const year = editYear ? parseInt(editYear) : undefined
      const releaseDate = month !== undefined && year !== undefined
        ? new Date(year, month, 1)
        : null

      await updateProduct(product.id, {
        name: editName,
        price: editPrice,
        releaseDate: releaseDate as any,
      })
      setSavedMsg("success")
      setTimeout(() => setSavedMsg(null), 3000)
    } catch (err) {
      console.error("Error guardando:", err)
      setSavedMsg("error")
    } finally {
      setSaving(false)
    }
  }

  // ── Post to Facebook ──
  const handlePostFB = async () => {
    setPostingFB(true)
    setFbStatus("idle")
    setFbError("")
    const images = product?.imageUrls?.filter((_, i) => selectedIndices.has(i)) || []
    try {
      const resp = await fetch("/api/social/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: fbPageId, accessToken: fbAccessToken, message: template, imageUrls: images }),
      })
      const data = await resp.json()
      if (data.success) {
        setFbStatus("success")
      } else {
        setFbStatus("error")
        setFbError(data.error || data.details?.error?.message || "Error desconocido")
      }
    } catch {
      setFbStatus("error")
      setFbError("Error de conexión con el servidor")
    } finally {
      setPostingFB(false)
    }
  }

  // ── Post to Instagram ──
  const handlePostIG = async () => {
    const sorted = [...selectedIndices].sort()
    const firstIdx = sorted[0]
    const imageUrl = product?.imageUrls?.[firstIdx]
    if (!imageUrl) {
      setIgStatus("error")
      setIgError("Selecciona al menos una imagen")
      return
    }
    setPostingIG(true)
    setIgStatus("idle")
    setIgError("")
    try {
      const resp = await fetch("/api/social/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igAccountId, accessToken: fbAccessToken, caption: template, imageUrl }),
      })
      const data = await resp.json()
      if (data.success) {
        setIgStatus("success")
      } else {
        setIgStatus("error")
        setIgError(data.error || data.details?.error?.message || "Error desconocido")
      }
    } catch {
      setIgStatus("error")
      setIgError("Error de conexión con el servidor")
    } finally {
      setPostingIG(false)
    }
  }

  // ── Render ──
  if (!isOpen || !product) return null

  const imageUrls = product.imageUrls || []
  const selectedCount = selectedIndices.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ──── HEADER ──── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-xl">📢</span> Publicar en Redes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
              {product.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ──── BODY ──── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Images ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                📸 Imágenes
                <span className="text-xs font-normal text-gray-400">({selectedCount} de {imageUrls.length} seleccionadas)</span>
              </h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Seleccionar todas</button>
                <button onClick={deselectAll} className="text-xs text-gray-500 hover:underline">Deseleccionar</button>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {imageUrls.map((url, i) => {
                const selected = selectedIndices.has(i)
                return (
                  <button
                    key={i}
                    onClick={() => toggleImage(i)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selected
                        ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 scale-[1.02]"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {i + 1}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Editable fields ── */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">✏️ Información del post</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mes</label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="">—</option>
                    {MONTHS_ES.map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Año</label>
                  <input
                    type="number"
                    min={2024}
                    max={2035}
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    placeholder="2027"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Template preview ── */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">📝 Vista previa del post</h3>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
              {template}
            </div>
          </section>

          {/* ── Settings (collapsible) ── */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">⚙️ Configuración de redes</span>
              <svg className={`w-4 h-4 transition-transform ${showSettings ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSettings && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estos datos se guardan en tu navegador. Necesitas una <strong>Facebook App</strong> configurada con los permisos <code>pages_manage_posts</code> y <code>instagram_content_publish</code>.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Facebook Page ID</label>
                  <input type="text" value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder="123456789012345" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Page Access Token</label>
                  <input type="password" value={fbAccessToken} onChange={(e) => setFbAccessToken(e.target.value)} placeholder="EAAx..." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Instagram Account ID</label>
                  <input type="text" value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} placeholder="178414..." className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button
                  onClick={saveSettings}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    settingsSaved
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {settingsSaved ? "✅ Guardado" : "💾 Guardar configuración"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ──── FOOTER / ACTIONS ──── */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 space-y-3">
          {/* FB/IG status messages */}
          {fbStatus === "success" && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              ✅ Publicado en Facebook correctamente
            </div>
          )}
          {fbStatus === "error" && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              ❌ Error en Facebook: {fbError}
            </div>
          )}
          {igStatus === "success" && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              ✅ Publicado en Instagram correctamente
            </div>
          )}
          {igStatus === "error" && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              ❌ Error en Instagram: {igError}
            </div>
          )}

          {/* Status messages */}
          {savedMsg === "success" && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              ✅ Cambios guardados en la base de datos
            </div>
          )}
          {savedMsg === "error" && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              ❌ Error al guardar. Revisa la consola.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {copied ? "✅ Copiado" : "📋 Copiar"}
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedCount === 0 || downloading}
              className="flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {downloading ? "⏳" : "📥 Descargar"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "⏳" : "💾 Guardar"}
            </button>
            <button
              onClick={handlePostFB}
              disabled={postingFB || !fbPageId || !fbAccessToken}
              className="flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {postingFB ? "⏳" : "📘 FB"}
            </button>
            <button
              onClick={handlePostIG}
              disabled={postingIG || !fbAccessToken || !igAccountId}
              className="flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {postingIG ? "⏳" : "📸 IG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
