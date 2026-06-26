"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth } from "@/lib/firebase/auth-client"
import { Timestamp, db } from "@/lib/firebase/firebase"
import { addProduct } from "@/lib/firebase/products"
import { createLineIfNotExists } from "@/lib/firebase/lines"
import { createManufacturerIfNotExists } from "@/lib/firebase/manufacturers"
import { normalizeText } from "@/lib/utils"
import { collection, getDocs } from "firebase/firestore"
import { getAdminAuthHeaders } from "@/lib/api/admin-client"

// Interfaz para un producto individual
interface ProductForm {
  id: string
  name: string
  price: string
  heightCm: string
  description: string
  brand: string
  line: string
  releaseDate: string
  scale: string
  category: string
  files: File[]
  previewUrls: string[]
  stock: string
  lowStockThreshold: string
  discountType: "none" | "percentage" | "fixed"
  discountValue: string
  discountStartDate: string
  discountEndDate: string
}

// Combobox component
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
    <div className="relative" ref={wrapperRef}>
      <label className="block font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onFocus={handleFocus}
        onChange={handleInputChange}
        required={required}
        className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

// Componente para reordenar imágenes
function ImageReorderComponent({
  images,
  onReorder,
  onRemove,
}: {
  images: any[]
  onReorder: (newOrder: any[]) => void
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
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Imágenes cargadas</h4>
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
              src={image.previewUrl || "/placeholder.svg"}
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

export default function AddProductPage() {
  const [user, authLoading, authError] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  // Estados para múltiples productos
  const [products, setProducts] = useState<ProductForm[]>([])
  const [activeProductIndex, setActiveProductIndex] = useState(0)
  const [formLoading, setFormLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [brands, setBrands] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [submitResults, setSubmitResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] })
  const [showMultipleProducts, setShowMultipleProducts] = useState(false)

  // Estado para manejar imágenes con orden
  const [productImages, setProductImages] = useState<{ [productId: string]: any[] }>({})

  // Crear producto vacío
  const createEmptyProduct = (): ProductForm => ({
    id: Math.random().toString(36).substr(2, 9),
    name: "",
    price: "",
    heightCm: "",
    description: "",
    brand: "",
    line: "",
    releaseDate: new Date().toISOString().split("T")[0],
    scale: "",
    category: "figura",
    files: [],
    previewUrls: [],
    stock: "",
    lowStockThreshold: "5",
    discountType: "none",
    discountValue: "",
    discountStartDate: "",
    discountEndDate: "",
  })

  // Inicializar con un producto
  useEffect(() => {
    if (products.length === 0) {
      setProducts([createEmptyProduct()])
    }
  }, [])

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

  // Agregar nuevo producto
  const addNewProduct = () => {
    if (products.length < 5) {
      const newProduct = createEmptyProduct()
      setProducts([...products, newProduct])
      setActiveProductIndex(products.length)
      setShowMultipleProducts(true)
    }
  }

  // Eliminar producto
  const removeProduct = (index: number) => {
    if (products.length > 1) {
      const productToRemove = products[index]
      const newProducts = products.filter((_, i) => i !== index)

      // Limpiar imágenes del producto eliminado
      const newProductImages = { ...productImages }
      delete newProductImages[productToRemove.id]
      setProductImages(newProductImages)

      setProducts(newProducts)

      // Ajustar índice activo si es necesario
      if (activeProductIndex >= newProducts.length) {
        setActiveProductIndex(newProducts.length - 1)
      }

      // Si solo queda un producto, ocultar modo múltiple
      if (newProducts.length === 1) {
        setShowMultipleProducts(false)
        setActiveProductIndex(0)
      }
    }
  }

  // Actualizar producto específico
  const updateProduct = (index: number, field: keyof ProductForm, value: any) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setProducts(newProducts)
  }

  // Manejar cambios en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateProduct(activeProductIndex, e.target.name as keyof ProductForm, e.target.value)
  }

  // Manejar archivos de imagen con reordenamiento
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    const currentProduct = products[activeProductIndex]

    if (files && files.length > 0) {
      const fileArray = Array.from(files)

      // Crear nuevas imágenes con IDs únicos
      const newImages = fileArray.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
      }))

      // Combinar con imágenes existentes
      const existingImages = productImages[currentProduct.id] || []
      const allImages = [...existingImages, ...newImages]

      // Actualizar estado de imágenes
      setProductImages((prev) => ({
        ...prev,
        [currentProduct.id]: allImages,
      }))

      // Actualizar producto con archivos y URLs en el orden correcto
      updateProductFiles(currentProduct.id, allImages)
    }
  }

  // Función para actualizar archivos del producto basado en el orden de imágenes
  const updateProductFiles = (productId: string, images: any[]) => {
    const files = images.map((img) => img.file)
    const previewUrls = images.map((img) => img.previewUrl)

    const productIndex = products.findIndex((p) => p.id === productId)
    if (productIndex !== -1) {
      const newProducts = [...products]
      newProducts[productIndex] = {
        ...newProducts[productIndex],
        files,
        previewUrls,
      }
      setProducts(newProducts)
    }
  }

  // Manejar reordenamiento de imágenes
  const handleImageReorder = (newOrder: any[]) => {
    const currentProduct = products[activeProductIndex]

    setProductImages((prev) => ({
      ...prev,
      [currentProduct.id]: newOrder,
    }))

    updateProductFiles(currentProduct.id, newOrder)
  }

  // Manejar eliminación de imagen individual
  const handleImageRemove = (imageId: string) => {
    const currentProduct = products[activeProductIndex]
    const currentImages = productImages[currentProduct.id] || []
    const newImages = currentImages.filter((img) => img.id !== imageId)

    setProductImages((prev) => ({
      ...prev,
      [currentProduct.id]: newImages,
    }))

    updateProductFiles(currentProduct.id, newImages)
  }

  // Copiar datos comunes del primer producto
  const copyFromFirstProduct = () => {
    if (products.length > 1 && activeProductIndex > 0) {
      const firstProduct = products[0]

      updateProduct(activeProductIndex, "brand", firstProduct.brand)
      updateProduct(activeProductIndex, "line", firstProduct.line)
      updateProduct(activeProductIndex, "category", firstProduct.category)
      updateProduct(activeProductIndex, "scale", firstProduct.scale)
      updateProduct(activeProductIndex, "releaseDate", firstProduct.releaseDate)
      updateProduct(activeProductIndex, "stock", firstProduct.stock)
      updateProduct(activeProductIndex, "lowStockThreshold", firstProduct.lowStockThreshold)
      // ⚠️ DESCUENTO TEMPORALMENTE DESHABILITADO
      // updateProduct(activeProductIndex, "discountType", firstProduct.discountType)
      // updateProduct(activeProductIndex, "discountValue", firstProduct.discountValue)
      // updateProduct(activeProductIndex, "discountStartDate", firstProduct.discountStartDate)
      // updateProduct(activeProductIndex, "discountEndDate", firstProduct.discountEndDate)
    }
  }

  // Validación
  const validateProduct = (product: ProductForm): string[] => {
    const errors: string[] = []

    if (!product.name.trim()) errors.push("Nombre requerido")
    if (!product.category.trim()) errors.push("Categoría requerida")

    return errors
  }

  // Procesar un producto individual
  const processProduct = async (product: ProductForm): Promise<void> => {
    const uploadedUrls: string[] = []
    const galleryThumbnailUrls: string[] = []
    let thumbnailUrl: string | null = null

    // Subir imágenes solo si hay archivos
    if (product.files.length > 0) {
      for (let i = 0; i < product.files.length; i++) {
        const file = product.files[i]
        const formDataApi = new FormData()
        formDataApi.append("file", file)
        formDataApi.append("isFirstImage", (i === 0).toString())

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formDataApi,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || `Error al subir ${file.name}: ${response.statusText}`)
        }

        const result = await response.json()
        uploadedUrls.push(result.imageUrl)
        if (result.galleryThumbnailUrl) galleryThumbnailUrls.push(result.galleryThumbnailUrl)
        if (result.isFirstImage && result.thumbnailUrl) thumbnailUrl = result.thumbnailUrl
      }
    }

    // Crear fabricante y línea solo si existen
    let manufacturerName = product.brand?.trim() || ""
    let lineName = product.line?.trim() || ""

    if (manufacturerName) {
      const manufacturerDoc = await createManufacturerIfNotExists(manufacturerName)
      manufacturerName = manufacturerDoc.name
    }

    if (lineName) {
      const normalizedLine = normalizeText(lineName)
      const lineDoc = await createLineIfNotExists(normalizedLine, manufacturerName)
      lineName = lineDoc.name
    }

    // ⚠️ DESCUENTO TEMPORALMENTE DESHABILITADO
    // TODO: Arreglar el manejo de undefined en Firebase
    /*
    let discountData: any = null

    const discountValueNum = Number(product.discountValue)

    if (
      product.discountType &&
      product.discountType !== "none" &&
      !isNaN(discountValueNum) &&
      discountValueNum > 0
    ) {
      discountData = {
        isActive: true,
        type: product.discountType as "percentage" | "fixed",
        value: discountValueNum,
      }

      if (product.discountStartDate) {
        const start = new Date(product.discountStartDate)
        if (!isNaN(start.getTime())) {
          discountData.startDate = Timestamp.fromDate(start)
        }
      }

      if (product.discountEndDate) {
        const end = new Date(product.discountEndDate)
        if (!isNaN(end.getTime())) {
          discountData.endDate = Timestamp.fromDate(end)
        }
      }
    }
    */

    // ✅ ARMAR productData
    const productData: any = {
      name: product.name || "",
      price: Number(product.price) || 0,
      description: product.description || "",
      imageUrls: uploadedUrls,
      galleryThumbnailUrls: galleryThumbnailUrls,
      brand: manufacturerName || "",
      line: lineName || "",
      heightCm: product.heightCm ? Number(product.heightCm) : null,
      createdAt: Timestamp.now(),
      releaseDate: product.releaseDate ? Timestamp.fromDate(new Date(product.releaseDate)) : null,
      scale: product.scale || null,
      category: product.category || "",
      views: 0,
      stock: Number(product.stock) || 0,
      lowStockThreshold: Number(product.lowStockThreshold) || 5,
    }

    // Solo agregar thumbnail si existe
    if (thumbnailUrl) {
      productData.thumbnailUrl = thumbnailUrl
    }

    // ⚠️ DESCUENTO TEMPORALMENTE DESHABILITADO
    // if (discountData) {
    //   productData.discount = discountData
    // }

    console.log("[v0] Final productData:", productData)
    // console.log("[v0] productData.discount:", productData.discount)

    await addProduct(productData)
  }

  // Enviar todos los productos
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault()

    const validProducts = products.filter((product) => {
      const errors = validateProduct(product)
      return errors.length === 0
    })

    if (validProducts.length === 0) {
      alert("No hay productos válidos para enviar")
      return
    }

    setFormLoading(true)
    setUploadProgress(0)
    setSubmitResults({ success: 0, errors: [] })

    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i]

      try {
        setUploadProgress(((i + 0.5) / validProducts.length) * 100)
        await processProduct(product)
        successCount++
        setUploadProgress(((i + 1) / validProducts.length) * 100)
      } catch (error) {
        console.error(`Error procesando producto ${product.name}:`, error)
        errors.push(`${product.name}: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    }

    setSubmitResults({ success: successCount, errors })

    if (successCount === validProducts.length) {
      alert(`✅ ${successCount} productos agregados con éxito`)
      // Limpiar formulario
      setProducts([createEmptyProduct()])
      setActiveProductIndex(0)
      setUploadProgress(0)
      setShowMultipleProducts(false)
      setProductImages({})
    } else {
      alert(`⚠️ ${successCount} productos agregados, ${errors.length} con errores. Revisa los detalles.`)
    }

    setFormLoading(false)
  }

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-900 dark:text-gray-100">Verificando autenticación...</p>
      </div>
    )
  if (authError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-900">
        <p>Error de autenticación: {authError.message}</p>
        <button onClick={() => router.push("/admin/login")} className="mt-4 bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700">
          Ir a Login
        </button>
      </div>
    )
  if (!user) return null

  const currentProduct = products[activeProductIndex] || createEmptyProduct()
  const currentErrors = validateProduct(currentProduct)
  const validProductsCount = products.filter((p) => validateProduct(p).length === 0).length
  const currentImages = productImages[currentProduct.id] || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Panel de Administración - {showMultipleProducts ? "Múltiples Productos" : "Agregar Producto"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Conectado como: {user.email}</p>
          </div>
          <button onClick={() => auth.signOut()} className="bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700">
            Cerrar Sesión
          </button>
        </div>

        {/* Resultados de envío */}
        {(submitResults.success > 0 || submitResults.errors.length > 0) && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            {submitResults.success > 0 && (
              <div className="text-green-600 dark:text-green-400 mb-2">✅ {submitResults.success} productos agregados exitosamente</div>
            )}
            {submitResults.errors.length > 0 && (
              <div className="text-red-600 dark:text-red-400">
                <div className="font-medium mb-2">❌ Errores encontrados:</div>
                {submitResults.errors.map((error, index) => (
                  <div key={index} className="text-sm ml-4">
                    • {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitAll} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
          {/* Selector de productos */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">
                {showMultipleProducts ? `Agregar Productos (${products.length}/5)` : "Agregar Producto"}
              </h1>
              <div className="flex gap-2">
                {!showMultipleProducts && (
                  <button
                    type="button"
                    onClick={addNewProduct}
                    className="bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded hover:bg-green-600 dark:hover:bg-green-700"
                  >
                    + Agregar Más Productos
                  </button>
                )}
                {showMultipleProducts && (
                  <button
                    type="button"
                    onClick={addNewProduct}
                    disabled={products.length >= 5}
                    className="bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded hover:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50"
                  >
                    + Agregar Producto
                  </button>
                )}
                <button
                  type="submit"
                  disabled={formLoading || validProductsCount === 0}                    className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading
                    ? "Procesando..."
                    : showMultipleProducts
                      ? `Enviar Todos (${validProductsCount})`
                      : "Agregar Producto"}
                </button>
              </div>
            </div>

            {/* Tabs de productos - Solo mostrar si hay múltiples */}
            {showMultipleProducts && (
              <div className="flex gap-2 flex-wrap">
                {products.map((product, index) => {
                  const errors = validateProduct(product)
                  const isValid = errors.length === 0
                  const isActive = index === activeProductIndex

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setActiveProductIndex(index)}
                      className={`relative px-4 py-2 rounded-lg border-2 transition-colors ${
                        isActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>Producto {index + 1}</span>
                        {isValid ? <span className="text-green-500">✓</span> : <span className="text-red-500">⚠</span>}
                      </div>
                      {product.name && <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-20">{product.name}</div>}
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeProduct(index)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 dark:bg-red-600 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 dark:hover:bg-red-700"
                        >
                          ×
                        </button>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Formulario del producto activo */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {showMultipleProducts ? `Producto ${activeProductIndex + 1}` : "Información del Producto"}
                  {currentProduct.name && `: ${currentProduct.name}`}
                </h3>
                {activeProductIndex > 0 && showMultipleProducts && (
                  <button
                    type="button"
                    onClick={copyFromFirstProduct}
                    className="bg-gray-500 dark:bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 dark:hover:bg-gray-700"
                  >
                    📋 Copiar datos del Producto 1
                  </button>
                )}
              </div>

              {/* Errores de validación */}
              {currentErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <div className="text-red-800 dark:text-red-200 font-medium mb-2">Campos obligatorios faltantes:</div>
                  <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                    {currentErrors.map((error, index) => (
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
                      value={currentProduct.name}
                      onChange={handleInputChange}
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      value={currentProduct.price}
                      onChange={handleInputChange}
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">📦 Inventario</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="stock">
                          Stock disponible <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                        </label>
                        <input
                          name="stock"
                          id="stock"
                          type="number"
                          min="0"
                          value={currentProduct.stock}
                          onChange={handleInputChange}
                          className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="lowStockThreshold">
                          Alerta de stock bajo <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                        </label>
                        <input
                          name="lowStockThreshold"
                          id="lowStockThreshold"
                          type="number"
                          min="0"
                          value={currentProduct.lowStockThreshold}
                          onChange={handleInputChange}
                          className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="5"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Se alertará cuando el stock sea menor o igual a este valor
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-900 dark:text-gray-200" htmlFor="heightCm">
                      Altura (cm) <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                    </label>
                    <input
                      name="heightCm"
                      id="heightCm"
                      type="number"
                      value={currentProduct.heightCm}
                      onChange={handleInputChange}
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      value={currentProduct.scale}
                      onChange={handleInputChange}
                      placeholder="1/6, 1/12..."
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block font-medium text-gray-900 dark:text-gray-200">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      id="category"
                      value={currentProduct.category}
                      onChange={handleInputChange}
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                      value={currentProduct.description}
                      onChange={handleInputChange}
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={3}
                      placeholder="Descripción del producto..."
                    />
                  </div>
                  {/* ⚠️ SECCIÓN DE DESCUENTO TEMPORALMENTE DESHABILITADA
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">💰 Descuento</h4>
                    ...resto del código de descuento...
                  </div>
                  */}
                  <Combobox
                    label="Fabricante (opcional)"
                    name="brand"
                    value={currentProduct.brand}
                    onChange={(val) => updateProduct(activeProductIndex, "brand", val)}
                    options={brands}
                  />
                  <Combobox
                    label="Línea (opcional)"
                    name="line"
                    value={currentProduct.line}
                    onChange={(val) => updateProduct(activeProductIndex, "line", val)}
                    options={lines}
                  />
                  <div>
                    <label htmlFor="releaseDate" className="block font-medium text-gray-900 dark:text-gray-200">
                      Fecha de lanzamiento <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
                    </label>
                    <input
                      name="releaseDate"
                      id="releaseDate"
                      type="date"
                      value={currentProduct.releaseDate}
                      onChange={handleInputChange}
                      className="w-full border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Imágenes */}
              <div>
                <label htmlFor="images" className="block font-medium text-gray-900 dark:text-gray-200">
                  Imágenes <span className="text-gray-500 dark:text-gray-400 text-sm">(opcional)</span>
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
                  🗜️ Se optimizan automáticamente a ~70KB • 📐 Genera 3 versiones: Original + Thumbnail + Gallery
                </p>

                {/* Componente de reordenamiento de imágenes */}
                <ImageReorderComponent
                  images={currentImages}
                  onReorder={handleImageReorder}
                  onRemove={handleImageRemove}
                />
              </div>
            </div>

            {/* Progress bar */}
            {uploadProgress > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-1">
                  <span>Procesando productos...</span>
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
        </form>
      </div>
    </div>
  )
}