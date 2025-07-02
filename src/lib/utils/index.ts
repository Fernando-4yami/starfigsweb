/**
 * Utilidades consolidadas para Starfigs
 */

// ✅ SLUGIFY MEJORADO
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Elimina acentos
    .replace(/\p{Diacritic}/gu, "") // Compatibilidad con Unicode
    .replace(/[^\w\s-]/g, "") // Elimina caracteres especiales
    .replace(/\s+/g, "-") // Espacios por guiones
    .replace(/--+/g, "-") // Evita guiones dobles
    .replace(/^-+|-+$/g, "") // Limpia extremos
}

// ✅ NORMALIZACIÓN DE TEXTO MEJORADA
export function normalizeText(text: string): string {
  if (!text) return ""
  return text
    .replace(/&nbsp;/g, " ") // Reemplazar &nbsp; con espacios normales
    .replace(/\u00A0/g, " ") // Reemplazar non-breaking space Unicode
    .replace(/\s+/g, " ") // Múltiples espacios → un espacio
    .trim() // Quitar espacios al inicio/final
}

export function normalizeForComparison(text: string): string {
  return normalizeText(text).toLowerCase()
}

// ✅ UTILIDADES DE FECHA CONSOLIDADAS
export function getCurrentMonthDateRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const start = new Date(year, month, 1, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  return { start, end }
}

export function getNextMonthStartDate() {
  const now = new Date()
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const month = (now.getMonth() + 1) % 12

  return new Date(year, month, 1, 0, 0, 0)
}

export function getMonthName(monthIndex: number) {
  const monthNames = [
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
  return monthNames[monthIndex]
}

// ✅ UTILIDAD PARA PARSEAR FECHAS SERIALIZADAS
export function parseSerializedDate(dateValue: any): Date | null {
  if (!dateValue) return null

  // Si es string ISO
  if (typeof dateValue === "string") {
    return new Date(dateValue)
  }

  // Si es Timestamp de Firestore
  if (dateValue.toDate && typeof dateValue.toDate === "function") {
    return dateValue.toDate()
  }

  // Si es objeto con seconds (serializado)
  if (dateValue.seconds) {
    return new Date(dateValue.seconds * 1000)
  }

  // Si ya es Date
  if (dateValue instanceof Date) {
    return dateValue
  }

  // Fallback
  return new Date(dateValue)
}

// ✅ UTILIDAD PARA FORMATEAR PRECIOS
export function formatPrice(price: number): string {
  return `S/. ${price.toFixed(2)}`
}

// ✅ UTILIDAD PARA TRUNCAR TEXTO
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

// ✅ UTILIDAD PARA VALIDAR EMAIL
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ✅ UTILIDAD PARA GENERAR ID ÚNICO
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// ✅ UTILIDAD PARA DEBOUNCE
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ✅ UTILIDAD PARA THROTTLE
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
