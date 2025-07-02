"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase/firebase"
import { getProductById, type Product, updateProduct } from "@/lib/firebase/products"
import { createLineIfNotExists } from "@/lib/firebase/lines"
import { createManufacturerIfNotExists } from "@/lib/firebase/manufacturers"
import { normalizeProductLine } from "@/lib/utils/normalize-text"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { app, Timestamp } from "@/lib/firebase/firebase"
import { collection, getDocs } from "firebase/firestore"

interface EditProductPageProps {
  params: { id: string }
}

// Combobox component para fabricantes y líneas
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
        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
        autoComplete="off"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredOptions.map((opt) => (
            <li key={opt} className="px-3 py-2 hover:bg-blue-100 cursor-pointer" onClick={() => handleOptionClick(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function EditProductPage({ params }: EditProductPageProps) {
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
  const [product, setProduct] = useState<Product | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  // Estados para todos los campos
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [description, setDescription] = useState("")
  const [scale, setScale] = useState("")
  const [brand, setBrand] = useState("")
  const [line, setLine] = useState("")
  const [releaseDate, setReleaseDate] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Estados para opciones de combobox
  const [brands, setBrands] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])

  const storage = getStorage(app)

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

  useEffect(() => {
    async function fetchProduct() {
      if (!user) return // Esperar a que se autentique

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

      // Convertir fecha de lanzamiento a formato de input date
      if (prod.releaseDate) {
        const date = prod.releaseDate.toDate()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        setReleaseDate(`${year}-${month}-${day}`)
      }

      setImageUrls(prod.imageUrls || [])
      setPageLoading(false)
    }
    fetchProduct()
  }, [params.id, router, user])

  // Drag & Drop handlers nativos
  const onDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault() // Necesario para permitir drop
  }

  const onDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return

    setImageUrls((prev) => {
      const newList = [...prev]
      const draggedItem = newList.splice(draggedIndex, 1)[0]
      newList.splice(index, 0, draggedItem)
      return newList
    })
    setDraggedIndex(null)
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => {
      const newList = [...prev]
      newList.splice(index, 1)
      return newList
    })
  }

  const handleRemoveThumbnail = () => {
    setThumbnailUrl("")
  }

  const handleUsePrimaryImageAsThumbnail = () => {
    if (imageUrls.length > 0) {
      setThumbnailUrl(imageUrls[0])
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setUploading(true)
    const files = Array.from(e.target.files)

    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `products/${params.id}/${Date.now()}_${file.name}`)
        const snapshot = await uploadBytes(storageRef, file)
        return await getDownloadURL(snapshot.ref)
      })

      const urls = await Promise.all(uploadPromises)
      setImageUrls((prev) => [...prev, ...urls])
    } catch (error) {
      console.error("Error subiendo imagenes:", error)
      alert("Error subiendo imágenes")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return

    setUploadingThumbnail(true)
    const file = e.target.files[0]

    try {
      // Usar la API de upload-image para procesar la miniatura
      const formData = new FormData()
      formData.append("file", file)
      formData.append("isFirstImage", "true") // Para que genere miniatura

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir miniatura")
      }

      const result = await response.json()

      // Usar la thumbnailUrl generada
      if (result.thumbnailUrl) {
        setThumbnailUrl(result.thumbnailUrl)
        console.log("✅ Nueva miniatura subida:", result.thumbnailUrl)
      } else {
        throw new Error("No se generó miniatura")
      }
    } catch (error) {
      console.error("Error subiendo miniatura:", error)
      alert("Error subiendo miniatura")
    } finally {
      setUploadingThumbnail(false)
      e.target.value = ""
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("El nombre del producto es obligatorio")
      return
    }

    const priceNum = price ? Number.parseFloat(price) : 0
    const heightNum = heightCm ? Number.parseInt(heightCm) : undefined

    if (price && isNaN(priceNum)) {
      alert("Precio inválido")
      return
    }

    setSaving(true)
    try {
      // Preparar datos para actualizar
      const updateData: any = {
        name: name.trim(),
        price: priceNum,
        heightCm: heightNum,
        description: description.trim(),
        scale: scale.trim() || undefined,
        category: category || "figura",
        imageUrls,
        thumbnailUrl: thumbnailUrl || undefined, // Incluir thumbnailUrl
      }

      // Solo procesar fabricante y línea si están presentes
      if (brand.trim()) {
        const manufacturerDoc = await createManufacturerIfNotExists(brand.trim())
        updateData.brand = manufacturerDoc.name
      }

      if (line.trim()) {
        const normalizedLine = normalizeProductLine(line.trim())
        const lineDoc = await createLineIfNotExists(normalizedLine, brand.trim() || "Sin marca")
        updateData.line = lineDoc.name
      }

      // Preparar fecha de lanzamiento si existe
      if (releaseDate) {
        updateData.releaseDate = Timestamp.fromDate(new Date(releaseDate))
      }

      await updateProduct(params.id, updateData)

      alert("Producto actualizado correctamente")
      router.push("/admin/products")
    } catch (e) {
      alert("Error al actualizar el producto")
      console.error(e)
    } finally {
      setSaving(false)
    }
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

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    )
  }

  // 🎯 FORMULARIO PRINCIPAL
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 👤 INFO DEL USUARIO */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Panel de Administración</h2>
              <p className="text-gray-600">Conectado como: {user.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/admin/products")}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                ← Volver
              </button>
              <button
                onClick={() => auth.signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* 📝 FORMULARIO DE EDICIÓN */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Editar Producto</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMNA 1: Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Básica</h3>

              <div>
                <label className="block mb-2 font-medium">Nombre del Producto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej: Ichiban Kuji Demon Slayer"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Precio (S/.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00 (opcional)"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Altura (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej: 18"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Escala</label>
                <input
                  type="text"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej: 1/6, 1/12, etc."
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Selecciona una categoría (opcional)</option>
                  <option value="figura">Figura</option>
                  <option value="plush">Peluche</option>
                  <option value="accessory">Accesorio</option>
                  <option value="otros">Otro</option>
                </select>
              </div>
            </div>

            {/* COLUMNA 2: Fabricante y línea */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Fabricante y Línea</h3>

              <Combobox label="Fabricante" name="brand" value={brand} onChange={setBrand} options={brands} />

              <Combobox label="Línea de Producto" name="line" value={line} onChange={setLine} options={lines} />

              <div>
                <label className="block mb-2 font-medium">Fecha de Lanzamiento</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-32 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={4}
                  placeholder="Descripción del producto..."
                />
              </div>
            </div>

            {/* COLUMNA 3: Gestión de imágenes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Imágenes</h3>

              {/* 🖼️ SECCIÓN DE MINIATURA */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3">🖼️ Miniatura (300px)</h4>

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
                        onClick={handleRemoveThumbnail}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                        title="Eliminar miniatura"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-green-700 text-center">✅ Miniatura configurada</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm">Sin miniatura personalizada</p>
                    <p className="text-xs">Se usará la primera imagen</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    disabled={uploadingThumbnail}
                    className="text-sm p-2 border rounded cursor-pointer disabled:opacity-50"
                  />

                  {imageUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUsePrimaryImageAsThumbnail}
                      disabled={uploadingThumbnail}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      📸 Usar primera imagen
                    </button>
                  )}

                  {uploadingThumbnail && (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      <span className="text-sm text-green-600">Procesando miniatura...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🖼️ SECCIÓN DE IMÁGENES PRINCIPALES */}
              <div>
                <label className="block mb-2 font-medium">Imágenes principales (arrastra para reordenar)</label>
                <div className="flex flex-col gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[200px]">
                  {imageUrls.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <p className="text-center">
                        No hay imágenes.
                        <br />
                        Agrega algunas usando el botón de abajo.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {imageUrls.map((url, index) => (
                        <div
                          key={url + index}
                          draggable
                          onDragStart={() => onDragStart(index)}
                          onDragOver={onDragOver}
                          onDrop={() => onDrop(index)}
                          className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden shadow-sm cursor-move bg-white flex items-center justify-center hover:shadow-md transition-shadow"
                        >
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemoveImage(index)
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                            title="Eliminar imagen"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 items-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="p-2 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                      <span className="text-gray-600 text-sm">Subiendo...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 💾 BOTONES DE ACCIÓN */}
          <div className="flex gap-4 pt-6 mt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving || uploading || uploadingThumbnail}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              onClick={() => router.push("/admin/products")}
              disabled={saving || uploading || uploadingThumbnail}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
