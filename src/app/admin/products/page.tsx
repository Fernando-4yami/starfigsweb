"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/firebase"
import { getProducts, deleteProductById, type Product } from "@/lib/firebase/products"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default function AdminProductsPage() {
  // 🔐 AUTENTICACIÓN - Proteger la página
  const [user, loading, error] = useAuthState(auth)
  const router = useRouter()

  // 🚪 REDIRECCIÓN - Si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  // 🔄 ESTADOS DEL COMPONENTE
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt" | "views">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function fetchProducts() {
    try {
      setProductsLoading(true)
      setProductsError(null)
      const prods = await getProducts(true) // Forzar actualización para obtener thumbnails
      setProducts(prods)
    } catch (err) {
      setProductsError("Error cargando productos")
      console.error(err)
    } finally {
      setProductsLoading(false)
    }
  }

  async function handleDelete(id: string, productName: string) {
    if (!confirm(`¿Seguro que quieres eliminar "${productName}"?`)) return

    try {
      setDeleting(id)
      await deleteProductById(id)
      setProducts(products.filter((p) => p.id !== id))
      alert("Producto eliminado correctamente")
    } catch (err) {
      alert("Error al eliminar producto")
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  // Obtener opciones únicas para filtros
  const uniqueCategories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
  const uniqueBrands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort()

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.line?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !categoryFilter || product.category === categoryFilter
      const matchesBrand = !brandFilter || product.brand === brandFilter

      return matchesSearch && matchesCategory && matchesBrand
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "price":
          aValue = a.price
          bValue = b.price
          break
        case "views":
          aValue = a.views || 0
          bValue = b.views || 0
          break
        case "createdAt":
        default:
          aValue = a.createdAt?.toDate().getTime() || 0
          bValue = b.createdAt?.toDate().getTime() || 0
          break
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Estadísticas
  const stats = {
    total: products.length,
    withThumbnails: products.filter((p) => p.thumbnailUrl).length,
    filtered: filteredAndSortedProducts.length,
    totalValue: products.reduce((sum, p) => sum + p.price, 0),
  }

  // 🔄 PANTALLAS DE CARGA Y ERROR
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error de autenticación: {error.message}</p>
          <button onClick={() => router.push("/admin/login")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Se está redirigiendo
  }

  // 🎯 PÁGINA PRINCIPAL
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 👤 HEADER CON INFO DEL USUARIO */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-gray-600">Conectado como: {user.email}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                <span>📦 {stats.total} productos</span>
                <span>🖼️ {stats.withThumbnails} con miniatura</span>
                <span>💰 S/. {stats.totalValue.toFixed(2)} total</span>
                {searchTerm || categoryFilter || brandFilter ? (
                  <span className="text-blue-600">🔍 {stats.filtered} filtrados</span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/products/add"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                + Agregar Producto
              </Link>
              <button
                onClick={() => auth.signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* 🔍 FILTROS Y BÚSQUEDA */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre, marca, línea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las marcas</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Fecha</option>
                  <option value="name">Nombre</option>
                  <option value="price">Precio</option>
                  <option value="views">Vistas</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3 py-2 border border-l-0 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <button
              onClick={fetchProducts}
              disabled={productsLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {productsLoading ? "Cargando..." : "🔄 Actualizar"}
            </button>
            <button
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("")
                setBrandFilter("")
                setSortBy("createdAt")
                setSortOrder("desc")
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              🗑️ Limpiar filtros
            </button>
          </div>
        </div>

        {/* 📋 CONTENIDO PRINCIPAL */}
        {productsLoading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Cargando productos...</p>
          </div>
        ) : productsError ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-red-600 mb-4">{productsError}</p>
            <button onClick={fetchProducts} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Reintentar
            </button>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            {searchTerm || categoryFilter || brandFilter ? (
              <div>
                <p className="text-gray-600 mb-4">No se encontraron productos con los filtros aplicados</p>
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryFilter("")
                    setBrandFilter("")
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">No hay productos registrados</p>
                <Link
                  href="/admin/products/add"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
                >
                  Agregar primer producto
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredAndSortedProducts.map((product) => {
              // 🖼️ USAR MINIATURA SI EXISTE, SINO PRIMERA IMAGEN
              const imageToShow =
                product.thumbnailUrl || product.imageUrls?.[0] || "/placeholder.svg?height=200&width=200"
              const usingThumbnail = !!product.thumbnailUrl

              return (
                <div
                  key={product.id}
                  className="bg-white border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative">
                    <img
                      src={imageToShow || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Indicadores en la esquina superior */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {/* Indicador de miniatura optimizada */}
                      {usingThumbnail && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded shadow-sm">⚡ FAST</div>
                      )}

                      {/* Contador de imágenes */}
                      {product.imageUrls && product.imageUrls.length > 1 && (
                        <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          📷 {product.imageUrls.length}
                        </div>
                      )}
                    </div>

                    {/* Indicador de vistas */}
                    {(product.views || 0) > 0 && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                        👁️ {product.views}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="font-semibold text-lg mb-1 line-clamp-2" title={product.name}>
                      {product.name}
                    </h2>
                    <p className="text-lg font-bold text-green-600 mb-2">S/. {(product.price ?? 0).toFixed(2)}</p>

                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      {product.brand && <p>🏭 {product.brand}</p>}
                      {product.line && <p>📦 {product.line}</p>}
                      {product.heightCm && <p>📏 {product.heightCm} cm</p>}
                      {product.scale && <p>⚖️ {product.scale}</p>}
                      {product.category && (
                        <p>
                          🏷️{" "}
                          <span className="capitalize">
                            {product.category === "figura" ? "Figura" : product.category}
                          </span>
                        </p>
                      )}
                      {product.releaseDate && (
                        <p className="text-amber-600">
                          📅 {format(product.releaseDate.toDate(), "MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-center flex-1 text-sm"
                      >
                        ✏️ Editar
                      </Link>

                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleting === product.id}
                        className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors flex-1 text-sm disabled:opacity-50"
                      >
                        {deleting === product.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
