// Definir los tipos de iconos disponibles
export type IconName = "Ruler" | "Settings" | "Sword" | "Gift" | "Heart" | "Zap" | "Package" | "Smile" | "DollarSign"

// ✅ INTERFACE CORREGIDA - Date en lugar de any
export interface Product {
  id: string
  slug: string
  name: string
  imageUrls: string[]
  price: number
  heightCm?: number
  releaseDate?: Date | null
  brand?: string
  line?: string
  category?: string
  scale?: string
  description?: string // ✅ AGREGAR: Para filtros más precisos
  createdAt?: Date | null
  views?: number // ← AGREGAR ESTA LÍNEA
  lastViewedAt?: Date | null // ← AGREGAR ESTA LÍNEA
}

export interface Filters {
  brands: string[]
  categories: string[]
  series: string[]
  priceRange: { min: number; max: number }
  heightRange: { min: number; max: number }
  scales: string[]
  lines: string[] // ✅ NUEVO: Filtro de líneas para categorías específicas
  hasReleaseDate: boolean | null
}

// Usar el tipo específico IconName en lugar de string genérico
export interface CategoryConfig {
  name: string
  slug: string
  description: string
  badge: string
  iconName: IconName // Cambiar de string a IconName
  colors: {
    primary: string
    secondary: string
    gradient: string
    focus: string
  }
  searchTerms: string[]
  searchType: "name" | "line" | "scale" | "custom"
  customFilter?: (product: Product) => boolean
  seriesList: string[]
  showLinesFilter?: boolean // ✅ NUEVO: Opcional para mostrar filtro de líneas
}

export type SortOption = "newest" | "oldest" | "price-low" | "price-high"

// ✅ NUEVO: Interface para opciones de filtros
export interface FilterOptions {
  brands: string[]
  categories: string[]
  scales: string[]
  lines: string[] // ✅ Líneas disponibles
  series: string[]
  priceRange: {
    min: number
    max: number
  }
}

// ✅ NUEVO: Interface para información de paginación
export interface PaginationInfo {
  startIndex: number
  endIndex: number
  totalItems: number
  currentPage: number
  totalPages: number
}
