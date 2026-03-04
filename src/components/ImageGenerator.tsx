"use client"

import { useState, useEffect } from "react"
import { toPng } from "html-to-image"

interface ImageGeneratorProps {
  productName: string
  productPrice: number
  productBrand?: string
  imageUrl?: string
  imageUrls?: string[]
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
}

function normalizeBrand(brand?: string): string | null {
  if (!brand) return null
  const b = brand.toLowerCase()
  if (b.includes("bandai") || b.includes("banpresto")) return "bandai"
  if (b.includes("taito")) return "taito"
  if (b.includes("furyu")) return "furyu"
  if (b.includes("sega")) return "sega"
  if (b.includes("vivit")) return "vivit"
  return null
}

function getBrandLogo(brand?: string): string | null {
  const key = normalizeBrand(brand)
  return key ? brandLogos[key] : null
}

/* ================= COMPONENTE SIMPLIFICADO ================= */

export default function ImageGenerator({
  productName,
  productPrice,
  productBrand,
  imageUrl,
  imageUrls = [],
}: ImageGeneratorProps) {
  const [generating, setGenerating] = useState<number | null>(null)
  const [componentId] = useState(() => `promo-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  const [currentData, setCurrentData] = useState({
    name: productName,
    price: productPrice,
    brand: productBrand,
    image: imageUrl || "/placeholder.png",
    images: imageUrls,
    _renderKey: Date.now(),
  })

  useEffect(() => {
    setCurrentData({
      name: productName,
      price: productPrice,
      brand: productBrand,
      image: imageUrl || "/placeholder.png",
      images: imageUrls,
      _renderKey: Date.now(),
    })
  }, [productName, productPrice, productBrand, imageUrl, imageUrls])

  const { character, details } = extractCharacterName(currentData.name)
  const brandLogo = getBrandLogo(currentData.brand)

  /* ================= GENERAR IMAGEN ================= */

  const generateImage = async (version: 1 | 2 | 3) => {
    setGenerating(version)

    try {
      setCurrentData((d) => ({ ...d, _renderKey: Date.now() }))
      await new Promise((r) => setTimeout(r, 300))

      const element = document.getElementById(`${componentId}-${version}`)
      if (!element) throw new Error("Template no encontrado")

      const images = element.querySelectorAll("img")

      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((res) => {
              if (img.complete && img.naturalHeight !== 0) return res()

              const timeout = setTimeout(() => {
                console.warn("⏱️ Imagen ignorada:", img.src)
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
        backgroundColor: "#EEF2FF",
      })

      // Descarga automática
      const link = document.createElement("a")
      const versionName = version === 1 ? "single" : version === 2 ? "triple-123" : "triple-234"
      link.download = `${productName.substring(0, 30)}-v${version}-${versionName}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error("❌ Error generando:", e)
      alert(`Error al generar versión ${version}`)
    } finally {
      setGenerating(null)
    }
  }

  const images123 = currentData.images.slice(0, 3)
  if (images123.length === 0) images123.push(currentData.image)

  const images234 = currentData.images.slice(1, 4)
  if (images234.length === 0) images234.push(currentData.image)

  return (
    <div className="space-y-2">
      {/* BOTONES DIRECTOS */}
      <div className="flex gap-2">
        <button
          onClick={() => generateImage(1)}
          disabled={generating !== null}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
          data-version="1"
        >
          {generating === 1 ? "⏳" : "1️⃣"}
        </button>
        <button
          onClick={() => generateImage(2)}
          disabled={generating !== null || currentData.images.length < 3}
          className="flex-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 disabled:opacity-50 transition-all"
          data-version="2"
        >
          {generating === 2 ? "⏳" : "2️⃣"}
        </button>
        <button
          onClick={() => generateImage(3)}
          disabled={generating !== null || currentData.images.length < 4}
          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-all"
          data-version="3"
        >
          {generating === 3 ? "⏳" : "3️⃣"}
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        1: Única | 2: Imgs 1,2,3 | 3: Imgs 2,3,4
      </div>

      {/* TEMPLATES OCULTOS */}
      <div style={{ position: "absolute", left: "-9999px" }} key={currentData._renderKey}>
        {/* VERSION 1 - SINGLE */}
        <PromoTemplate
          templateId={`${componentId}-1`}
          character={character}
          details={details}
          price={currentData.price}
          imageUrl={currentData.image}
          brandName={currentData.brand}
          brandLogo={brandLogo}
        />

        {/* VERSION 2 - TRIPLE 123 */}
        <PromoTemplateTriple
          templateId={`${componentId}-2`}
          character={character}
          details={details}
          price={currentData.price}
          imageUrls={images123}
          brandName={currentData.brand}
          brandLogo={brandLogo}
        />

        {/* VERSION 3 - TRIPLE 234 */}
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
}

/* ================= TEMPLATE ORIGINAL (1 IMAGEN) ================= */

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
        background: "#EEF2FF",
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
          top: 24,
          left: 24,
          width: 150,
          filter: "invert(1) brightness(2) drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          zIndex: 60,
        }}
      />

      {/* PRECIO - VERDE NEÓN MODERNO */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          padding: "12px 28px",
          background: "linear-gradient(135deg, #22D3EE, #4F46E5)",
          color: "#fff",
          fontSize: 42,
          fontWeight: 900,
          clipPath: "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 4% 50%)",
          boxShadow: "0 12px 35px rgba(16,185,129,.5), 0 0 30px rgba(16,185,129,.2)",
          zIndex: 50,
          letterSpacing: "-0.5px",
        }}
      >
        S/ {price}
      </div>

      {/* TÍTULO Y DETALLES - MAGENTA/ROSA VIBRANTE */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
          right: 48,
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
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
                transform: "rotate(-8deg)",
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
              background: "linear-gradient(135deg, rgba(79,70,229,.9), rgba(34,211,238,.85))",
              clipPath: "polygon(0 0, 96% 0, 100% 18%, 100% 100%, 4% 100%, 0 82%)",
              boxShadow: "0 20px 45px rgba(236,72,153,.5), 0 0 40px rgba(236,72,153,.15)",
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
                  color: "#FFF1F2",
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

/* ================= TEMPLATE (3 IMÁGENES) ================= */

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
        background: "#EEF2FF",
      }}
    >
      {/* LAYOUT: 1 GRANDE IZQUIERDA (65%) + 2 PEQUEÑAS DERECHA (35%) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* IMAGEN PRINCIPAL (65% IZQUIERDA) */}
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

        {/* COLUMNA DERECHA CON 2 IMÁGENES (35%) */}
        <div
          style={{
            width: "35%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* IMAGEN 2 (ARRIBA) */}
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

          {/* IMAGEN 3 (ABAJO) */}
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

      {/* LOGO STARFIGS - Esquina superior izquierda */}
      <img
        src="/starfigs-logo.png"
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 150,
          filter: "invert(1) brightness(2) drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          zIndex: 60,
        }}
      />

      {/* PRECIO - VERDE NEÓN MODERNO */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          padding: "12px 28px",
          background: "linear-gradient(135deg, #22D3EE, #4F46E5)",
          color: "#fff",
          fontSize: 42,
          fontWeight: 900,
          clipPath: "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 4% 50%)",
          boxShadow: "0 12px 35px rgba(16,185,129,.5), 0 0 30px rgba(16,185,129,.2)",
          zIndex: 50,
          letterSpacing: "-0.5px",
        }}
      >
        S/ {price}
      </div>

      {/* TÍTULO Y DETALLES - MAGENTA/ROSA VIBRANTE */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
          right: 48,
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
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
                transform: "rotate(-8deg)",
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
              background: "linear-gradient(135deg, rgba(79,70,229,.9), rgba(34,211,238,.85))",
              clipPath: "polygon(0 0, 96% 0, 100% 18%, 100% 100%, 4% 100%, 0 82%)",
              boxShadow: "0 20px 45px rgba(236,72,153,.5), 0 0 40px rgba(236,72,153,.15)",
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
                  color: "#FFF1F2",
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