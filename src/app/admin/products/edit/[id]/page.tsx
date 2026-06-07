"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/auth-client"
import { db, Timestamp } from "@/lib/firebase/firebase"
import { getProductById, type Product, updateProduct } from "@/lib/firebase/products"
import { createLineIfNotExists } from "@/lib/firebase/lines"
import { createManufacturerIfNotExists } from "@/lib/firebase/manufacturers"
import { normalizeText } from "@/lib/utils"
import { collection, getDocs } from "firebase/firestore"

interface EditProductPageProps {
  params: { id: string }
}

// 🆕 Interfaz para imágenes con orden
interface ImageItem {
  id: string
  url: string
}

// Combobox component mejorado
function Combobox({
  label,
  value,
  onChange,
  options,
  name,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  name: string
  required?: boolean
}) {
  const [showOptions, setShowOptions] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowOptions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleFocus = () => {
    setFilteredOptions(options)
    setShowOptions(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    setFilteredOptions(options.filter((opt) => opt.toLowerCase().includes(val.toLowerCase())))
  }

  const handleOptionClick = (option: string) => {
    onChange(option)
    setShowOptions(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-200" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onFocus={handleFocus}
        onChange={handleInputChange}
        required={required}
        className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        autoComplete="off"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredOptions.map((opt) => (
            <li key={opt} className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 cursor-pointer" onClick={() => handleOptionClick(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// 🆕 Componente mejorado para reordenar imágenes
function ImageReorderComponent({
  images,
  onReorder,
  onRemove,
}: {
  images: ImageItem[]
  onReorder: (newOrder: ImageItem[]) => void
  onRemove: (imageId: string) => void
}) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedItem(imageId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, imageId: string) => {
    e.preventDefault()
    setDragOverItem(imageId)
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetImageId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = images.findIndex((img) => img.id === draggedItem)
    const targetIndex = images.findIndex((img) => img.id === targetImageId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(targetIndex, 0, draggedImage)

    onReorder(newImages)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  if (images.length === 0) return null

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Imágenes del producto</h4>
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Arrastra para reordenar</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={(e) => handleDragStart(e, image.id)}
            onDragOver={(e) => handleDragOver(e, image.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, image.id)}
            onDragEnd={handleDragEnd}
            className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-move transition-all ${
              draggedItem === image.id
                ? "opacity-50 scale-95"
                : dragOverItem === image.id
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          >
            <img
              src={image.url || "/placeholder.svg"}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Indicador de orden */}
            <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>

            {/* Indicador de imagen principal */}
            {index === 0 && (
              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">Principal</div>
            )}

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              className="absolute top-1 right-1 bg-red-500 dark:bg-red-600 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center"
              style={{ marginRight: index === 0 ? "60px" : "0" }}
            >
              ×
            </button>

            {/* Icono de arrastrar */}
            <div className="absolute bottom-1 right-1 bg-gray-800 bg-opacity-70 text-white p-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        💡 La primera imagen será la principal del producto. Arrastra para cambiar el orden.
      </p>
    </div>
  )
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const [user, authLoading, authError] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  // Estados del componente
  const [product, setProduct] = useState<Product | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Estados para todos los campos
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [description, setDescription] = useState("")
  const [scale, setScale] = useState("")
  const [brand, setBrand] = useState("")
  const [line, setLine] = useState("")
  const [releaseDate, setReleaseDate] = useState("")
  const [createdAt, setCreatedAt] = useState("") // 🆕 Estado para createdAt
  const [category, setCategory] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")

  // 🆕 Estado mejorado para imágenes
  const [productImages, setProductImages] = useState<ImageItem[]>([])

  // Estados para opciones de combobox
  const [brands, setBrands] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])

  // Cargar opciones de fabricantes y líneas
  useEffect(() => {
    const fetchData = async () => {
      if (!db) return
      const snapshot = await getDocs(collection(db, "products"))
      const brandSet = new Set<string>()
      const lineSet = new Set<string>()

      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.brand) brandSet.add(data.brand)
        if (data.line) lineSet.add(data.line)
      })

      setBrands([...brandSet].sort())
      setLines([...lineSet].sort())
    }
    fetchData()
  }, [])

  // Cargar producto
  useEffect(() => {
    async function fetchProduct() {
      if (!user || !params.id) return

      setPageLoading(true)
      const prod = await getProductById(params.id)
      if (!prod) {
        alert("Producto no encontrado")
        router.push("/admin/products")
        return
      }

      setProduct(prod)
      setName(prod.name)
      setPrice(prod.price.toString())
      setHeightCm(prod.heightCm?.toString() || "")
      setDescription(prod.description || "")
      setScale(prod.scale || "")
      setBrand(prod.brand || "")
      setLine(prod.line || "")
      setCategory(prod.category || "figura")
      setThumbnailUrl(prod.thumbnailUrl || "")

      // Convertir fecha de lanzamiento
      if (prod.releaseDate) {
        const date = prod.releaseDate
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        setReleaseDate(`${year}-${month}-${day}`)
      }

      // 🆕 Convertir createdAt
      if (prod.createdAt) {
     const date = prod.createdAt instanceof Date 
  ? prod.createdAt 
  : (prod.createdAt as any).toDate?.() ?? new Date(prod.createdAt)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        setCreatedAt(`${year}-${month}-${day}`)
      }

      // 🆕 Convertir URLs a ImageItems
      const imageItems: ImageItem[] = (prod.imageUrls || []).map((url, index) => ({
        id: `existing-${index}`,
        url,
      }))
      setProductImages(imageItems)

      setPageLoading(false)
    }
    fetchProduct()
  }, [params.id, router, user])

  // 🆕 Manejar reordenamiento de imágenes
  const handleImageReorder = (newOrder: ImageItem[]) => {
    setProductImages(newOrder)
  }

  // 🆕 Manejar eliminación de imagen
  const handleImageRemove = (imageId: string) => {
    setProductImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  // 🆕 Manejar nuevas imágenes
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadProgress(10)
    const fileArray = Array.from(files)

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("isFirstImage", "false")

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Error al subir ${file.name}`)
        }

        const result = await response.json()
        setUploadProgress(((index + 1) / fileArray.length) * 90)

        return {
          id: `new-${Date.now()}-${index}`,
          url: result.imageUrl,
        }
      })

      const newImages = await Promise.all(uploadPromises)
      setProductImages((prev) => [...prev, ...newImages])
      setUploadProgress(100)

      setTimeout(() => setUploadProgress(0), 1000)
    } catch (error) {
      console.error("Error subiendo imágenes:", error)
      alert("Error subiendo algunas imágenes")
      setUploadProgress(0)
    }

    e.target.value = ""
  }

  // Manejar miniatura
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("isFirstImage", "true")

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir miniatura")
      }

      const result = await response.json()
      if (result.thumbnailUrl) {
        setThumbnailUrl(result.thumbnailUrl)
        setUploadProgress(100)
        setTimeout(() => setUploadProgress(0), 1000)
      }
    } catch (error) {
      console.error("Error subiendo miniatura:", error)
      alert("Error subiendo miniatura")
      setUploadProgress(0)
    }

    e.target.value = ""
  }

  const handleUsePrimaryImageAsThumbnail = () => {
    if (productImages.length > 0) {
      setThumbnailUrl(productImages[0].url)
    }
  }

  // Validación
  const validateForm = (): string[] => {
    const errors: string[] = []
    if (!name.trim()) errors.push("Nombre requerido")
    if (!category.trim()) errors.push("Categoría requerida")
    return errors
  }

  // Guardar cambios
  const handleSave = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      alert(`Errores de validación:\n${errors.join("\n")}`)
      return
    }

    if (!params.id) return

    setSaving(true)
    setUploadProgress(10)

    try {
      // 🔧 Preparar datos con validación mejorada
      const updateData: any = {
        name: name.trim(),
        price: price ? Number.parseFloat(price) : 0,
        category: category || "figura",
        imageUrls: productImages.map((img) => img.url),
      }

      // 🔥 PRESERVAR VISTAS EXISTENTES - CRÍTICO
      if (product && typeof product.views === "number") {
        updateData.views = product.views
      }

      // 🔥 PRESERVAR ÚLTIMA VISTA
      if (product && product.lastViewedAt) {
        updateData.lastViewedAt = product.lastViewedAt
      }

      // 🆕 MANEJAR FECHA DE CREACIÓN (editable)
      if (createdAt && createdAt.trim()) {
        try {
          updateData.createdAt = Timestamp.fromDate(new Date(createdAt))
        } catch (dateError) {
          console.warn("Error procesando createdAt:", dateError)
          // Fallback: preservar el original si falla el parseo
          if (product && product.createdAt) {
            updateData.createdAt = product.createdAt
          }
        }
      } else if (product && product.createdAt) {
        // Si se borró el campo, preservar el original
        updateData.createdAt = product.createdAt
      }

      // Solo agregar campos opcionales si tienen valor
      if (heightCm && !isNaN(Number.parseInt(heightCm))) {
        updateData.heightCm = Number.parseInt(heightCm)
      }

      if (description.trim()) {
        updateData.description = description.trim()
      }

      if (scale.trim()) {
        updateData.scale = scale.trim()
      }

      if (thumbnailUrl) {
        updateData.thumbnailUrl = thumbnailUrl
      }

      setUploadProgress(30)

      // Fabricante
      if (brand.trim()) {
        try {
          const manufacturerDoc = await createManufacturerIfNotExists(brand.trim())
          updateData.brand = manufacturerDoc.name
        } catch (brandError) {
          console.warn("Error procesando fabricante:", brandError)
          updateData.brand = brand.trim()
        }
      } else {
        updateData.brand = null
      }

      // Línea
      if (line.trim()) {
        try {
          const normalizedLine = normalizeText(line.trim())
          const lineDoc = await createLineIfNotExists(normalizedLine, brand.trim())
          updateData.line = lineDoc.name
        } catch (lineError) {
          console.warn("Error procesando línea:", lineError)
          updateData.line = line.trim()
        }
      } else {
        updateData.line = null
      }

      setUploadProgress(70)

      if (releaseDate && releaseDate.trim()) {
        try {
          updateData.releaseDate = Timestamp.fromDate(new Date(releaseDate))
        } catch (dateError) {
          console.warn("Error procesando fecha:", dateError)
        }
      } else {
        updateData.releaseDate = null
      }

      setUploadProgress(90)

      console.log("📝 Datos a actualizar:", updateData)
      console.log("🆔 ID del producto:", params.id)

      await updateProduct(params.id, updateData)

      setUploadProgress(100)
      alert("✅ Producto actualizado correctamente")

      setTimeout(() => {
        setUploadProgress(0)
        router.push("/admin/products")
      }, 1000)
    } catch (error) {
      console.error("❌ Error completo actualizando producto:", error)

      let errorMessage = "Error desconocido"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }

      alert(`❌ Error al actualizar el producto:\n${errorMessage}\n\nRevisa la consola para más detalles.`)
      setUploadProgress(0)
    } finally {
      setSaving(false)
    }
  }

  // Pantallas de carga y error
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-gray-900 dark:text-gray-100">Error de autenticación: {authError.message}</p>
          <button onClick={() => router.push("/admin/login")} className="mt-4 bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700">
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Cargando producto...</p>
        </div>
      </div>
    )
  }

  const formErrors = validateForm()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Panel de Administración - Editar Producto</h2>
            <p className="text-gray-600 dark:text-gray-400">Conectado como: {user.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/products")}
              className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-700"
            >
              ← Volver
            </button>
            <button onClick={() => auth.signOut()} className="bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700">
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar Producto</h1>
            <button
              onClick={handleSave}
              disabled={saving || formErrors.length > 0}
              className="bg-blue-500 dark:bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>

          {/* Info sobre campos obligatorios */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📝 Campos Obligatorios</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Solo son obligatorios: <strong>Nombre</strong> y <strong>Categoría</strong>. Todos los demás campos son
              opcionales.
            </p>
          </div>

          {/* Errores de validación */}
          {formErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <div className="text-red-800 dark:text-red-200 font-medium mb-2">Campos obligatorios faltantes:</div>
              <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="name">
                  Nombre *
                </label>
                <input
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="price">
                  Precio (S/.) <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                </label>
                <input
                  name="price"
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="heightCm">
                  Altura (cm) <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                </label>
                <input
                  name="heightCm"
                  id="heightCm"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ej: 18"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="scale">
                  Escala <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                </label>
                <input
                  name="scale"
                  id="scale"
                  type="text"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  placeholder="1/6, 1/12..."
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="category" className="block font-medium text-gray-900 dark:text-gray-200">
                  Categoría *
                </label>
                <select
                  name="category"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="figura">Figura</option>
                  <option value="plush">Peluche</option>
                  <option value="accessory">Accesorio</option>
                  <option value="otros">Otro</option>
                </select>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="description">
                  Descripción <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Descripción del producto..."
                />
              </div>

              <Combobox label="Fabricante (opcional)" name="brand" value={brand} onChange={setBrand} options={brands} />

              <Combobox label="Línea (opcional)" name="line" value={line} onChange={setLine} options={lines} />

              <div>
                <label htmlFor="releaseDate" className="block font-medium text-gray-900 dark:text-gray-200">
                  Fecha de lanzamiento <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                </label>
                <input
                  name="releaseDate"
                  id="releaseDate"
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* 🆕 Campo createdAt editable */}
              <div>
                <label htmlFor="createdAt" className="block font-medium text-gray-900 dark:text-gray-200">
                  Fecha de creación <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                </label>
                <input
                  name="createdAt"
                  id="createdAt"
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="w-full border dark:border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ⚠️ Modifica solo si necesitas corregir la fecha original del producto.
                </p>
              </div>
            </div>
          </div>

          {/* Sección de miniatura */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">🖼️ Miniatura (300px)</h4>

            {thumbnailUrl ? (
              <div className="space-y-3">
                <div className="relative w-32 h-32 mx-auto">
                  <img
                    src={thumbnailUrl || "/placeholder.svg"}
                    alt="Miniatura actual"
                    className="w-full h-full object-cover rounded-lg border-2 border-green-300"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl("")}
                    className="absolute -top-2 -right-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 text-center">✅ Miniatura configurada</p>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <p className="text-sm">Sin miniatura personalizada</p>
                <p className="text-xs">Se usará la primera imagen</p>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="text-sm p-2 border rounded cursor-pointer"
              />

              {productImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleUsePrimaryImageAsThumbnail}
                  className="text-sm bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-600 dark:hover:bg-blue-700"
                >
                  📸 Usar primera imagen
                </button>
              )}
            </div>
          </div>

          {/* Sección de imágenes principales */}
          <div>
            <label htmlFor="images" className="block font-medium mb-2">
              Imágenes principales <span className="text-gray-500 text-sm">(opcional)</span>
            </label>
            <input
              id="images"
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              🗜️ Se optimizan automáticamente a ~70KB • 🔍 Genera 3 versiones: Original + Thumbnail + Gallery
            </p>

            {/* Componente de reordenamiento */}
            <ImageReorderComponent images={productImages} onReorder={handleImageReorder} onRemove={handleImageRemove} />
          </div>

          {/* Progress bar */}
          {uploadProgress > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-1">
                <span>Procesando...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}