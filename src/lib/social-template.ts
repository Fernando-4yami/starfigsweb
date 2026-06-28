export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

interface SocialTemplateInput {
  name: string
  slug?: string
  id?: string
  releaseDate?: Date | string | null
  monthIndex?: number | null
  year?: number | null
}

function getReleaseLabel(input: SocialTemplateInput): string {
  if (
    input.monthIndex !== null &&
    input.monthIndex !== undefined &&
    input.year &&
    MONTHS_ES[input.monthIndex]
  ) {
    return `${MONTHS_ES[input.monthIndex]} ${input.year}`
  }

  if (!input.releaseDate) return "Por confirmar"

  const date = input.releaseDate instanceof Date
    ? input.releaseDate
    : new Date(input.releaseDate)

  if (Number.isNaN(date.getTime())) return "Por confirmar"
  return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`
}

export function generateSocialTemplate(input: SocialTemplateInput): string {
  const productUrl = `https://starfigsperu.com/products/${input.slug || input.id || ""}`

  return [
    "⭐🇯🇵 PREVENTA / BAJO PEDIDO",
    "",
    input.name,
    "",
    "",
    `🗓️ Lanzamiento: ${getReleaseLabel(input)}`,
    "",
    "🌟 Más detalles:",
    productUrl,
    "",
    "🎁 Envío gratis por Shalom a agencia como beneficio de preventa",
    "🚢 Llegada estimada: 2-3 meses después del lanzamiento",
    "",
    "🇯🇵 Producto ORIGINAL y SELLADO",
  ].join("\n")
}
