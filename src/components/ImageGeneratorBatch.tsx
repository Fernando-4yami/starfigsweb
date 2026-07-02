"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { toPng } from "html-to-image"
import { updateProduct } from "@/lib/firebase/products"
import { revalidateAdminProduct } from "@/lib/api/admin-revalidation"
import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"

export interface ImageGeneratorBatchHandle {
  generatePng: (version: 1 | 2 | 3) => Promise<{
    dataUrl: string
    productName: string
  }>
}

interface ImageGeneratorBatchProps {
  productName: string
  productPrice: number
  productBrand?: string
  imageUrl?: string
  imageUrls?: string[]
  onRemove: () => void
  productId?: string
  productSlug?: string
}

interface BatchVisualData {
  name: string
  price: number
  brand: string | undefined
  image: string
  images: string[]
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

/* ================= UTILIDADES ================= */

function extractCharacterName(title: string): {
  character: string
  details: string
} {
  const lastDashIndex = title.lastIndexOf(" - ")
  if (lastDashIndex === -1) {
    return { character: title.trim(), details: "" }
  }
  return {
    character: title.substring(lastDashIndex + 3).trim(),
    details: title.substring(0, lastDashIndex).trim(),
  }
}

/* ================= FABRICANTES ================= */

const brandLogos: Record<string, string> = {
  sega: "/fabricantes/sega.png",
  bandai: "/fabricantes/bandai.png",
  taito: "/fabricantes/taito.png",
  furyu: "/fabricantes/furyu.png",
  vivit: "/fabricantes/vivit.png",
  konami: "/fabricantes/konami.png",
  gigo: "/fabricantes/gigo.png",
  "system-service": "/fabricantes/system-service.png",
}

function normalizeBrand(brand?: string): string | null {
  if (!brand) return null
  const b = brand.toLowerCase()
  if (b.includes("bandai") || b.includes("banpresto")) return "bandai"
  if (b.includes("taito")) return "taito"
  if (b.includes("furyu")) return "furyu"
  if (b.includes("sega")) return "sega"
  if (b.includes("vivit")) return "vivit"
  if (b.includes("konami")) return "konami"
  if (b.includes("gigo")) return "gigo"
  if (b.includes("system service") || b.includes("systemservice")) return "system-service"
  return null
}

function getBrandLogo(brand?: string): string | null {
  const key = normalizeBrand(brand)
  return key ? brandLogos[key] : null
}

const CATALOG_PALETTE = {
  canvas: "#F8F5FF",
  titleGradient:
    "linear-gradient(135deg, rgba(109,40,217,.9), rgba(219,39,119,.86))",
  titleShadow:
    "0 20px 45px rgba(109,40,217,.28), 0 0 40px rgba(219,39,119,.18)",
  priceGradient:
    "linear-gradient(135deg, rgba(109,40,217,.9), rgba(219,39,119,.86))",
  priceShadow:
    "0 12px 35px rgba(109,40,217,.28), 0 0 30px rgba(219,39,119,.18)",
  priceText: "#FFFFFF",
  detailText: "#FFFFFF",
} as const

/* ================= COPYPASTE TEMPLATE ================= */

const generateProductTemplate = (name: string, price: number, slug?: string, id?: string): string => {
  const baseUrl = "https://starfigsperu.com"
  const productUrl = `${baseUrl}/products/${slug || id || ''}`

  let template = `🔖 ${name}
Precio: s/${price.toFixed(2)}
Reserva min: s/40.00
🌟 Mas detalles: ${productUrl}`

  return template
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand("copy")
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

/* ================= COMPONENTE CON PREVIEW ================= */

const ImageGeneratorBatch = forwardRef<ImageGeneratorBatchHandle, ImageGeneratorBatchProps>(function ImageGeneratorBatch({
  productName,
  productPrice,
  productBrand,
  imageUrl,
  imageUrls = [],
  onRemove,
  productId,
  productSlug,
}, ref) {
  const [generating, setGenerating] = useState<number | null>(null)
  const [previewVersion, setPreviewVersion] = useState<1 | 2 | 3>(1)
  const [previews, setPreviews] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch fresco desde Firestore sin caché
  const fetchFreshData = async (): Promise<BatchVisualData | null> => {
    if (!productId) return null
    setRefreshing(true)
    try {
      const docRef = doc(db, "products", productId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const hasFreshImages = Array.isArray(data.imageUrls)
        const freshImages = hasFreshImages
          ? data.imageUrls.filter((url: unknown): url is string => typeof url === "string")
          : currentData.images
        const freshData: BatchVisualData = {
          name: typeof data.name === "string" ? data.name : currentData.name,
          price: typeof data.price === "number" ? data.price : currentData.price,
          brand: typeof data.brand === "string" ? data.brand : currentData.brand,
          images: freshImages,
          image:
            freshImages[0] ||
            (typeof data.thumbnailUrl === "string" && data.thumbnailUrl) ||
            currentData.image ||
            "/placeholder.png",
        }

        setCurrentData(freshData)
        setTempName(freshData.name)
        setTempPrice(String(freshData.price))
        setPreviews({})
        return freshData
      }
      return null
    } catch (e) {
      console.error("Error actualizando desde Firebase:", e)
      return null
    } finally {
      setRefreshing(false)
    }
  }

  // Escuchar el evento global para refrescar todos a la vez
  useEffect(() => {
    const handler = () => fetchFreshData()
    window.addEventListener("refresh-all-prices", handler)
    return () => window.removeEventListener("refresh-all-prices", handler)
  }, [productId])

  const handleRefreshAll = () => {
    window.dispatchEvent(new CustomEvent("refresh-all-prices"))
  }
  const [componentId] = useState(() => `promo-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  const [currentData, setCurrentData] = useState({
    name: productName,
    price: productPrice,
    brand: productBrand,
    image: imageUrl || "/placeholder.png",
    images: imageUrls,
  })
  const [editingName, setEditingName] = useState(false)
  const [editingPrice, setEditingPrice] = useState(false)
  const [tempName, setTempName] = useState(productName)
  const [tempPrice, setTempPrice] = useState(String(productPrice))

  useEffect(() => {
    void fetchFreshData()
  }, [productId])

  const { character, details } = extractCharacterName(currentData.name)
  const brandLogo = getBrandLogo(currentData.brand)

  const saveName = async (newName: string) => {
    setCurrentData((prev) => ({ ...prev, name: newName }))
    setPreviews({})
    setEditingName(false)
    if (!productId) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateProduct(productId, { name: newName })
      try {
        if (productSlug) await revalidateAdminProduct(productSlug)
      } catch {
        setSaveError("Guardado; la ficha publica puede tardar en refrescarse")
      }
    } catch (e) {
      setSaveError("Error al guardar nombre")
    } finally {
      setSaving(false)
    }
  }

  const savePrice = async (newPrice: number) => {
    setCurrentData((prev) => ({ ...prev, price: newPrice }))
    setPreviews({})
    setEditingPrice(false)
    if (!productId) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateProduct(productId, { price: newPrice })
      try {
        if (productSlug) await revalidateAdminProduct(productSlug)
      } catch {
        setSaveError("Guardado; la ficha publica puede tardar en refrescarse")
      }
    } catch (e) {
      setSaveError("Error al guardar precio")
    } finally {
      setSaving(false)
    }
  }

  /* ================= COPIAR PLANTILLA ================= */

  const handleCopyTemplate = async () => {
    const template = generateProductTemplate(currentData.name, currentData.price, productSlug, productId)
    const success = await copyToClipboard(template)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  /* ================= GENERAR PREVIEW ================= */

  useEffect(() => {
    const generatePreview = async () => {
      if (previews[previewVersion]) return

      await new Promise((r) => setTimeout(r, 100))

      const element = document.getElementById(`${componentId}-${previewVersion}`)
      if (!element) return

      try {
        const dataUrl = await toPng(element, {
          pixelRatio: 0.3,
          cacheBust: false,
          backgroundColor: CATALOG_PALETTE.canvas,
        })

        setPreviews((prev) => ({ ...prev, [previewVersion]: dataUrl }))
      } catch (err) {
        console.warn("Preview error:", err)
      }
    }

    generatePreview()
  }, [previewVersion, componentId, previews])

  /* ================= GENERAR IMAGEN ================= */

  const generateImage = async (version: 1 | 2 | 3) => {
    setGenerating(version)

    try {
      const freshData = await fetchFreshData()
      await waitForNextPaint()

      const element = document.getElementById(`${componentId}-${version}`)
      if (!element) throw new Error("Template no encontrado")

      const images = element.querySelectorAll("img")

      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((res) => {
              if (img.complete && img.naturalHeight !== 0) return res()

              const timeout = setTimeout(() => {
                img.style.display = "none"
                res()
              }, 3000)

              img.onload = () => {
                clearTimeout(timeout)
                res()
              }

              img.onerror = () => {
                clearTimeout(timeout)
                img.style.display = "none"
                res()
              }
            })
        )
      )

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: CATALOG_PALETTE.canvas,
      })

      const link = document.createElement("a")
      const versionName = version === 1 ? "single" : version === 2 ? "triple-123" : "triple-234"
      link.download = `${(freshData?.name || currentData.name).substring(0, 30)}-v${version}-${versionName}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error("❌ Error generando:", e)
      alert(`Error al generar versión ${version}`)
    } finally {
      setGenerating(null)
    }
  }

  /* ================= GENERAR PNG PARA ZIP (desde el padre) ================= */

  useImperativeHandle(ref, () => ({
    generatePng: async (version: 1 | 2 | 3) => {
      const freshData = await fetchFreshData()
      await waitForNextPaint()

      const element = document.getElementById(`${componentId}-${version}`)
      if (!element) throw new Error("Template no encontrado")

      const images = element.querySelectorAll("img")
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((res) => {
              if (img.complete && img.naturalHeight !== 0) return res()
              const timeout = setTimeout(() => {
                img.style.display = "none"
                res()
              }, 3000)
              img.onload = () => { clearTimeout(timeout); res() }
              img.onerror = () => { clearTimeout(timeout); img.style.display = "none"; res() }
            })
        )
      )

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: CATALOG_PALETTE.canvas,
      })

      return {
        dataUrl,
        productName: freshData?.name || currentData.name,
      }
    },
  }))

  const images123 = currentData.images.slice(0, 3)
  while (images123.length < 3) {
    images123.push(currentData.image)
  }

  const images234 = currentData.images.slice(1, 4)
  while (images234.length < 3) {
    images234.push(currentData.images[0] || currentData.image)
  }

  return (
    <div className="flex gap-3 items-start">
      {/* PREVIEW */}
      <div className="w-28 flex-shrink-0">
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded border-2 border-gray-300 dark:border-gray-600 overflow-hidden mb-1.5">
          {previews[previewVersion] ? (
            <img src={previews[previewVersion]} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
              Generando...
            </div>
          )}
        </div>

        {/* SELECTOR DE PREVIEW */}
        <div className="flex gap-1">
          {([1, 2, 3] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPreviewVersion(v)}
              className={`flex-1 py-1 text-[10px] font-bold rounded ${
                previewVersion === v
                  ? v === 1 ? "bg-indigo-600 text-white" : v === 2 ? "bg-cyan-600 text-white" : "bg-purple-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* CONTROLES */}
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
        {/* BOTONES DE GENERACIÓN - fila completa */}
        <div className="col-span-2 flex gap-1.5">
          {([1, 2, 3] as const).map((v) => (
            <button
              key={v}
              onClick={() => generateImage(v)}
              disabled={generating !== null}
              className={`flex-1 py-1.5 rounded text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50 ${
                v === 1 ? "bg-indigo-600" : v === 2 ? "bg-cyan-600" : "bg-purple-600"
              }`}
              data-version={String(v)}
            >
              {generating === v ? "⏳" : `${v}️⃣`}
            </button>
          ))}
        </div>

        {/* EDITAR NOMBRE */}
        {editingName ? (
          <div className="col-span-2 flex gap-1">
            <input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName(tempName)
                if (e.key === "Escape") { setTempName(currentData.name); setEditingName(false) }
              }}
              className="flex-1 min-w-0 px-2 py-1 border border-indigo-400 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button onClick={() => saveName(tempName)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">✓</button>
          </div>
        ) : (
          <div className="col-span-2">
            <button
              onClick={() => { setTempName(currentData.name); setEditingName(true) }}
              className="w-full px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] hover:bg-gray-200 dark:hover:bg-gray-600 text-left break-words leading-tight"
            >
              ✏️ {currentData.name}
            </button>
          </div>
        )}

        {/* EDITAR PRECIO */}
        {editingPrice ? (
          <div className="col-span-2 flex gap-1">
            <input
              autoFocus
              type="number"
              step="0.01"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { const p = parseFloat(tempPrice); if (!isNaN(p)) savePrice(p) }
                if (e.key === "Escape") { setTempPrice(String(currentData.price)); setEditingPrice(false) }
              }}
              className="flex-1 px-2 py-1 border border-green-400 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button onClick={() => { const p = parseFloat(tempPrice); if (!isNaN(p)) savePrice(p) }} className="px-2 py-1 bg-green-600 text-white rounded text-xs">✓</button>
          </div>
        ) : (
          <button
            onClick={() => { setTempPrice(String(currentData.price)); setEditingPrice(true) }}
            className="w-full px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] hover:bg-gray-200 dark:hover:bg-gray-600 text-left"
          >
            💰 S/ {currentData.price.toFixed(2)}
          </button>
        )}

        {/* FEEDBACK GUARDADO */}
        {saving && (
          <p className="col-span-2 text-[10px] text-center text-indigo-500 dark:text-indigo-400 animate-pulse">💾 Guardando...</p>
        )}
        {saveError && (
          <p className="col-span-2 text-[10px] text-center text-red-500">{saveError}</p>
        )}

        {/* COPIAR PLANTILLA */}
        <button
          onClick={handleCopyTemplate}
          className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${
            copied ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {copied ? "✓ Copiado" : "📋 Copiar"}
        </button>

        {/* BOTÓN REMOVER */}
        <button
          onClick={onRemove}
          className="px-2 py-1.5 bg-red-500 text-white rounded text-[11px] hover:bg-red-600"
        >
          ✕ Quitar
        </button>

        {/* ACTUALIZAR TODOS LOS PRECIOS - ocupa toda la fila */}
        <button
          onClick={handleRefreshAll}
          disabled={refreshing || saving}
          className="col-span-2 px-2 py-1 bg-amber-500 text-white rounded text-[11px] font-bold hover:bg-amber-600 disabled:opacity-50"
        >
          {refreshing ? "🔄 Actualizando..." : "🔄 Actualizar datos"}
        </button>
      </div>

      {/* TEMPLATES OCULTOS */}
      <div style={{ position: "absolute", left: "-9999px" }}>
        <PromoTemplate
          templateId={`${componentId}-1`}
          character={character}
          details={details}
          price={currentData.price}
          imageUrl={currentData.image}
          brandName={currentData.brand}
          brandLogo={brandLogo}
        />

        <PromoTemplateTriple
          templateId={`${componentId}-2`}
          character={character}
          details={details}
          price={currentData.price}
          imageUrls={images123}
          brandName={currentData.brand}
          brandLogo={brandLogo}
        />

        <PromoTemplateTriple
          templateId={`${componentId}-3`}
          character={character}
          details={details}
          price={currentData.price}
          imageUrls={images234}
          brandName={currentData.brand}
          brandLogo={brandLogo}
        />
      </div>
    </div>
  )
})

export default ImageGeneratorBatch

/* ================= TEMPLATE SINGLE (SOLO COLORES CAMBIADOS) ================= */

function PromoTemplate({
  templateId,
  character,
  details,
  price,
  imageUrl,
  brandName,
  brandLogo,
}: {
  templateId: string
  character: string
  details: string
  price: number
  imageUrl: string
  brandName?: string
  brandLogo: string | null
}) {
  return (
    <div
      id={templateId}
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        background: CATALOG_PALETTE.canvas,
      }}
    >
      <img
        src={imageUrl}
        alt={character}
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      <img
        src="/starfigs-logo.png"
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: 128,
          right: 24,
          width: 130,
          filter: "invert(1) brightness(2) drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          zIndex: 60,
        }}
      />

      {/* Precio */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          padding: "12px 28px",
          background: CATALOG_PALETTE.priceGradient,
          color: CATALOG_PALETTE.priceText,
          fontSize: 42,
          fontWeight: 900,
          clipPath: "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 4% 50%)",
          boxShadow: CATALOG_PALETTE.priceShadow,
          zIndex: 50,
          letterSpacing: "-0.5px",
        }}
      >
        S/ {price}
      </div>

      {/* Título y detalles */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
        }}
      >
        <div style={{ position: "relative", display: "block", maxWidth: "max-content" }}>
          {brandLogo && (
            <img
              src={brandLogo}
              crossOrigin="anonymous"
              alt={brandName}
              style={{
                position: "absolute",
                top: -16,
                right: 20,
                height: 36,
                transform: "rotate(8deg)",
                background: "#fff",
                padding: "4px 8px",
                borderRadius: 6,
                filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))",
                zIndex: 10,
              }}
            />
          )}

          <div
            style={{
              padding: "20px 32px 18px",
              background: CATALOG_PALETTE.titleGradient,
              clipPath: "polygon(0 0, 96% 0, 100% 18%, 100% 100%, 4% 100%, 0 82%)",
              boxShadow: CATALOG_PALETTE.titleShadow,
              width: "max-content",
              maxWidth: "100%",
              minWidth: "100%",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.1,
                textShadow: "3px 3px 6px rgba(0,0,0,.4)",
                letterSpacing: "-1px",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
            >
              {character}
            </h1>

            {details && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 600,
                  color: CATALOG_PALETTE.detailText,
                  textShadow: "2px 2px 4px rgba(0,0,0,.3)",
                }}
              >
                {details}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= TEMPLATE TRIPLE (SOLO COLORES CAMBIADOS) ================= */

function PromoTemplateTriple({
  templateId,
  character,
  details,
  price,
  imageUrls,
  brandName,
  brandLogo,
}: {
  templateId: string
  character: string
  details: string
  price: number
  imageUrls: string[]
  brandName?: string
  brandLogo: string | null
}) {
  return (
    <div
      id={templateId}
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        background: CATALOG_PALETTE.canvas,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            width: "65%",
            height: "100%",
            position: "relative",
            borderRight: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          <img
            src={imageUrls[0]}
            crossOrigin="anonymous"
            alt={`${character} - Principal`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        <div
          style={{
            width: "35%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {imageUrls[1] && (
            <div
              style={{
                flex: 1,
                position: "relative",
                borderBottom: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <img
                src={imageUrls[1]}
                crossOrigin="anonymous"
                alt={`${character} - 2`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {imageUrls[2] && (
            <div
              style={{
                flex: 1,
                position: "relative",
              }}
            >
              <img
                src={imageUrls[2]}
                crossOrigin="anonymous"
                alt={`${character} - 3`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <img
        src="/starfigs-logo.png"
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: 128,
          right: 24,
          width: 130,
          filter: "invert(1) brightness(2) drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          zIndex: 60,
        }}
      />

      {/* Precio */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          padding: "12px 28px",
          background: CATALOG_PALETTE.priceGradient,
          color: CATALOG_PALETTE.priceText,
          fontSize: 42,
          fontWeight: 900,
          clipPath: "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 4% 50%)",
          boxShadow: CATALOG_PALETTE.priceShadow,
          zIndex: 50,
          letterSpacing: "-0.5px",
        }}
      >
        S/ {price}
      </div>

      {/* Título y detalles */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
        }}
      >
        <div style={{ position: "relative", display: "block", maxWidth: "max-content" }}>
          {brandLogo && (
            <img
              src={brandLogo}
              crossOrigin="anonymous"
              alt={brandName}
              style={{
                position: "absolute",
                top: -16,
                right: 20,
                height: 36,
                transform: "rotate(8deg)",
                background: "#fff",
                padding: "4px 8px",
                borderRadius: 6,
                filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))",
                zIndex: 10,
              }}
            />
          )}

          <div
            style={{
              padding: "20px 32px 18px",
              background: CATALOG_PALETTE.titleGradient,
              clipPath: "polygon(0 0, 96% 0, 100% 18%, 100% 100%, 4% 100%, 0 82%)",
              boxShadow: CATALOG_PALETTE.titleShadow,
              width: "max-content",
              maxWidth: "100%",
              minWidth: "100%",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.1,
                textShadow: "3px 3px 6px rgba(0,0,0,.4)",
                letterSpacing: "-1px",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
            >
              {character}
            </h1>

            {details && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 600,
                  color: CATALOG_PALETTE.detailText,
                  textShadow: "2px 2px 4px rgba(0,0,0,.3)",
                }}
              >
                {details}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
