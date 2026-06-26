// generate-voucher-pdf.ts
// Generador de comprobante de reserva PDF
// Coordenadas: y desde ARRIBA (top-down), aumenta hacia abajo
// Diseno fiel a la plantilla original para 1 producto
// Multiples productos: gaps se comprimen automaticamente

import { jsPDF } from "jspdf"

// ================================================================
// COLORES
// ================================================================
const NEGRO = "#141414"
const GRIS = "#555555"
const GRIS_SUAVE = "#f7f7f7"
const BORDE = "#dedede"
const DORADO = "#c8a64b"
const ROJO = "#d00000"
const VERDE = "#188038"
const BG_PRODUCTO = "#fbfbfb"
const BG_BENEFICIO = "#f7fff7"
const BORDE_BENEFICIO = "#9ed49e"
const TEXTO_BENEFICIO = "#166b24"
const BG_AVISO = "#fffdf2"
const BORDE_AVISO = "#d9b83f"
const TEXTO_AVISO = "#6a4c00"
const BG_SALDO = "#fffafa"

// ================================================================
// TIPOS
// ================================================================
export interface ProductoItem {
  nombre: string
  tipo?: string
  origen?: string
}

export interface VoucherData {
  pedido?: string
  productos: ProductoItem[]
  cliente: string
  dni: string
  telefono: string
  llegada: string
  precio: number
  reserva: number
  ruc?: string
  whatsapp?: string
  correo?: string
  facebook?: string
  web?: string
  fecha?: string
}

// ================================================================
// HELPERS
// ================================================================

function money(valor: number): string {
  return `S/ ${valor.toFixed(2)}`
}

function wrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  yTop: number,
  maxWidth: number,
  fontName = "Helvetica",
  size = 10,
  leading = 12
): number {
  const words = String(text).split(" ")
  const lines: string[] = []
  let line = ""

  const isBold = fontName.includes("Bold")
  const isItalic = fontName.includes("Italic") || fontName.includes("Oblique")
  let fontStyle = "normal"
  if (isBold && isItalic) fontStyle = "bolditalic"
  else if (isBold) fontStyle = "bold"
  else if (isItalic) fontStyle = "italic"

  doc.setFont("Helvetica", fontStyle)
  doc.setFontSize(size)

  for (const word of words) {
    const test = (line + " " + word).trim()
    if (doc.getTextWidth(test) <= maxWidth) {
      line = test
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)

  let cy = yTop
  doc.setFont("Helvetica", fontStyle)
  doc.setFontSize(size)
  for (const ln of lines) {
    doc.text(ln, x, cy)
    cy += leading
  }

  return cy
}

function sectionTitle(doc: jsPDF, title: string, x: number, yTop: number, width: number): void {
  doc.setTextColor(NEGRO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(12.5)
  doc.text("| " + title.toUpperCase(), x, yTop)
  doc.setDrawColor(DORADO)
  doc.setLineWidth(1.1)
  doc.line(x, yTop + 6, x + width, yTop + 6)
}

function dataRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  yTop: number,
  w: number,
  h: number
): number {
  doc.setDrawColor(BORDE)
  doc.setFillColor(GRIS_SUAVE)
  doc.rect(x, yTop, w, h, "FD")
  doc.setTextColor(NEGRO)
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10.5)
  doc.text(label, x + 12, yTop + h / 2 + 1)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(10.5)
  doc.text(String(value), x + w - 12, yTop + h / 2 + 1, { align: "right" })
  return yTop + h
}

function maxIndex(arr: number[]): number {
  let idx = 0
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[idx]) idx = i
  }
  return idx
}

// ================================================================
// GENERADOR PRINCIPAL
// ================================================================

export function generateVoucherPdf(data: VoucherData, logoBase64?: string): jsPDF {
  const doc = new jsPDF("p", "pt", "a4")
  const pageH = doc.internal.pageSize.getHeight() // ~841.89
  const pageW = doc.internal.pageSize.getWidth()  // ~595.28

  const MARGEN_FINAL = 13 // margen bottom (como el original: ~13pts)
  const x = 38
  const contentW = pageW - 76

  const fecha = data.fecha || new Date().toLocaleDateString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
  const pedido = data.pedido || "AT0000"
  const saldo = Math.max(0, data.precio - data.reserva)
  const productos = data.productos && data.productos.length > 0
    ? data.productos
    : [{ nombre: "", tipo: "Figura", origen: "Producto Original Importado de Japon" }]

  // ================================================================
  // HEADER (posiciones fijas desde top)
  // ================================================================

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "JPEG", x, 22, 92, 110, undefined, "FAST")
    } catch { /* ignora error de logo */ }
  }

  doc.setTextColor(NEGRO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(17)
  doc.text("STARFIGS PERU", x + 120, 57)

  doc.setTextColor(GRIS)
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(8.6)
  doc.text(`RUC: ${data.ruc || "10770538535"}`, x + 120, 74)
  doc.text(`WhatsApp: ${data.whatsapp || "+51 926 951 167"}`, x + 120, 91)
  doc.text(data.correo || "starfigss@gmail.com", x + 120, 108)
  doc.text(`${data.facebook || "facebook.com/starfigss"} | ${data.web || "starfigsperu.com"}`, x + 120, 125)

  // Pedido box
  doc.setDrawColor(DORADO)
  doc.setLineWidth(1.1)
  doc.roundedRect(pageW - 176, 39, 138, 43, 8, 8, "S")

  doc.setTextColor(NEGRO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(15)
  doc.text(`#${pedido}`, pageW - 107, 57, { align: "center" })

  doc.setTextColor(GRIS)
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`Fecha: ${fecha}`, pageW - 107, 73, { align: "center" })

  // Title
  doc.setTextColor(NEGRO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(24)
  doc.text("COMPROBANTE DE RESERVA", pageW / 2, 168, { align: "center" })

  doc.setDrawColor(DORADO)
  doc.setLineWidth(1.3)
  doc.line(x, 188, x + contentW, 188)

  // ================================================================
  // PRODUCTO(S)
  // ================================================================
  let cy = 220
  sectionTitle(doc, "Producto(s) en preventa", x, cy, contentW)
  cy += 20 // gap 20pts (Python original: y -= 20)

  // Altura de caja: 75pts para 1 producto, crece para varios
  const itemH = 52
  const productBoxH = productos.length === 1
    ? 75
    : Math.max(75, 30 + productos.length * itemH)

  doc.setFillColor(BG_PRODUCTO)
  doc.setDrawColor(BORDE)
  doc.roundedRect(x, cy, contentW, productBoxH, 7, 7, "FD")

  // Dibujar productos
  doc.setTextColor(NEGRO)
  if (productos.length === 1) {
    // 1 producto: posiciones FIJAS desde cy (como Python original)
    // Python: wrapped_text at y-24, tipo at y-49, origen at y-64
    const prod = productos[0]
    wrappedText(doc, prod.nombre || "", x + 14, cy + 24, contentW - 28, "Helvetica-Bold", 10.5, 13)
    doc.setTextColor(GRIS)
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(10)
    doc.text(prod.tipo || "Figura", x + 14, cy + 49)
    doc.text(prod.origen || "Producto Original Importado de Japon", x + 14, cy + 64)
  } else {
    // Multiples productos: posiciones secuenciales
    let itemY = cy + 16
    for (let i = 0; i < productos.length; i++) {
      const prod = productos[i]
      doc.setTextColor(NEGRO)
      itemY = wrappedText(doc, `${i + 1}. ${prod.nombre || ""}`, x + 14, itemY, contentW - 28, "Helvetica-Bold", 10.5, 13)
      doc.setTextColor(GRIS)
      doc.setFont("Helvetica", "normal")
      doc.setFontSize(9.5)
      doc.text(`${prod.tipo || "Figura"} - ${prod.origen || "Producto Original Importado de Japon"}`, x + 14, itemY)
      itemY += 16
    }
  }

  cy += productBoxH

  // ================================================================
  // CALCULO DE GAPS DINAMICOS
  // ================================================================
  // Layout despues de caja de producto (en top-origin):
  //   gap1: 33
  //   section "Detalles" (solo dibuja, no avanza cy) -> cy += 16
  //   4 dataRows: 124
  //   gap2: 58
  //   section "Cuenta" (solo dibuja) -> cy += 16
  //   3 rows cuenta: 31 + 31 + 35 = 97
  //   gap3: 54
  //   beneficio: 34
  //   gap4: 14
  //   aviso: 68
  // Total fijo (sin gaps): 16 + 124 + 16 + 97 + 34 + 68 = 355
  // Total gaps: 33 + 58 + 54 + 14 = 159

  const GAPS_ORIG = [33, 58, 54, 14]
  const TOTAL_GAPS_ORIG = 159
  const FIXED_AFTER = 16 + 124 + 16 + 97 + 34 + 68 // 355

  let gapSpace = (pageH - cy - MARGEN_FINAL) - FIXED_AFTER
  let rowH = 31
  let saldoH = 35
  let gaps: number[]

  function distribuirGaps(espacio: number, minGap: number): number[] {
    if (espacio >= TOTAL_GAPS_ORIG) return [...GAPS_ORIG]
    const result = GAPS_ORIG.map(g => Math.max(minGap, Math.round(g * espacio / TOTAL_GAPS_ORIG)))
    let sum = result.reduce((a, b) => a + b, 0)
    let diff = espacio - sum
    while (diff > 0) {
      result[maxIndex(result)]++
      diff--
    }
    while (diff < 0) {
      const i = maxIndex(result)
      if (result[i] > minGap) {
        result[i]--
        diff++
      }
    }
    return result
  }

  if (gapSpace >= TOTAL_GAPS_ORIG) {
    gaps = [...GAPS_ORIG]
  } else if (gapSpace >= 12) {
    gaps = distribuirGaps(gapSpace, 3)
  } else {
    // Muy poco espacio: reducir row heights y usar gaps minimos
    rowH = 28
    saldoH = 32
    const fixedTight = 16 + 4 * rowH + 16 + rowH + rowH + saldoH + 34 + 68
    gapSpace = (pageH - cy - MARGEN_FINAL) - fixedTight
    gaps = distribuirGaps(Math.max(0, gapSpace), 2)
  }

  // ================================================================
  // DETALLES DE ENTREGA
  // ================================================================
  cy += gaps[0]
  sectionTitle(doc, "Detalles de entrega", x, cy, contentW)
  cy += 16

  cy = dataRow(doc, "Cliente:", data.cliente, x, cy, contentW, rowH)
  cy = dataRow(doc, "DNI:", data.dni, x, cy, contentW, rowH)
  cy = dataRow(doc, "Telefono:", data.telefono, x, cy, contentW, rowH)
  cy = dataRow(doc, "Llegada Estimada:", data.llegada, x, cy, contentW, rowH)

  // ================================================================
  // ESTADO DE CUENTA
  // ================================================================
  cy += gaps[1]
  sectionTitle(doc, "Estado de cuenta", x, cy, contentW)
  cy += 16

  cy = dataRow(doc, "Precio Total del Producto", money(data.precio), x, cy, contentW, rowH)

  // Monto Abonado
  doc.setDrawColor(BORDE)
  doc.setFillColor(GRIS_SUAVE)
  doc.rect(x, cy, contentW, rowH, "FD")
  doc.setTextColor(VERDE)
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10.5)
  doc.text("Monto Abonado", x + 12, cy + rowH / 2 + 1)
  doc.text("- " + money(data.reserva), x + contentW - 12, cy + rowH / 2 + 1, { align: "right" })
  cy += rowH

  // Saldo Pendiente
  doc.setDrawColor(BORDE)
  doc.setFillColor(BG_SALDO)
  doc.rect(x, cy, contentW, saldoH, "FD")
  doc.setTextColor(ROJO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(15)
  doc.text("SALDO PENDIENTE", x + 12, cy + saldoH / 2 + 2)
  doc.text(money(saldo), x + contentW - 12, cy + saldoH / 2 + 2, { align: "right" })
  cy += saldoH

  // ================================================================
  // BENEFICIO
  // ================================================================
  cy += gaps[2]
  doc.setFillColor(BG_BENEFICIO)
  doc.setDrawColor(BORDE_BENEFICIO)
  doc.roundedRect(x, cy, contentW, 34, 7, 7, "FD")
  doc.setTextColor(TEXTO_BENEFICIO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(9.4)
  doc.text("Beneficio de preventa: envio gratuito por Agencias Shalom a nivel nacional.", x + 12, cy + 17)
  cy += 34

  // ================================================================
  // AVISO
  // ================================================================
  cy += gaps[3]
  doc.setFillColor(BG_AVISO)
  doc.setDrawColor(BORDE_AVISO)
  doc.roundedRect(x, cy, contentW, 68, 7, 7, "FD")
  doc.setTextColor(TEXTO_AVISO)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(9)
  doc.text("AVISO IMPORTANTE:", x + 12, cy + 18)
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(8.7)
  wrappedText(doc,
    "Este comprobante acredita la reserva del producto. El saldo pendiente debera cancelarse una vez notificada la llegada del producto a Peru. El cliente dispone de hasta 45 dias calendario para cancelar el saldo restante.",
    x + 112, cy + 18, contentW - 124, "Helvetica", 8.7, 11.5
  )

  return doc
}
