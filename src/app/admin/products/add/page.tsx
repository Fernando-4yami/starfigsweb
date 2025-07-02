"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, Timestamp, db } from "@/lib/firebase/firebase"
import { addProduct } from "@/lib/firebase/products"
import { createLineIfNotExists } from "@/lib/firebase/lines"
import { createManufacturerIfNotExists } from "@/lib/firebase/manufacturers"
import { normalizeProductLine } from "@/lib/utils/normalize-text"
import { collection, getDocs } from "firebase/firestore"

// Combobox component (sin cambios)
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
        className="w-full border p-2 rounded"
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

export default function AddProductPage() {
  const [user, authLoading, authError] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  const [form, setForm] = useState({
    name: "",
    price: "",
    heightCm: "",
    description: "",
    brand: "",
    line: "",
    releaseDate: "",
    scale: "",
    category: "",
  })
  const [files, setFiles] = useState<File[] | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [brands, setBrands] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
    } else {
      setFiles(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.brand || !form.line) {
      alert("Selecciona o escribe un fabricante y una línea")
      return
    }

    if (!files || files.length === 0) {
      alert("Selecciona al menos una imagen")
      return
    }

    if (form.name.trim().length < 3 || Number(form.price) <= 0) {
      alert("Nombre o precio inválido")
      return
    }

    setFormLoading(true)
    setUploadProgress(0)

    try {
      const uploadedUrls: string[] = []
      const galleryThumbnailUrls: string[] = [] // 🆕 Array para gallery thumbnails
      let thumbnailUrl: string | null = null
      const totalFiles = files.length
      let filesUploaded = 0

      console.log(`🚀 INICIANDO SUBIDA DE ${totalFiles} ARCHIVOS`)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formDataApi = new FormData()
        formDataApi.append("file", file)

        const isFirstImage = i === 0
        formDataApi.append("isFirstImage", isFirstImage.toString())

        console.log(`📤 SUBIENDO ARCHIVO ${i + 1}/${totalFiles}:`)
        console.log(`   📁 Nombre: ${file.name}`)
        console.log(`   🔢 Índice: ${i}`)
        console.log(`   🥇 Es primera imagen: ${isFirstImage}`)

        try {
          const response = await fetch("/api/upload-image", {
            method: "POST",
            body: formDataApi,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.details || `Error al subir ${file.name}: ${response.statusText}`)
          }

          const result = await response.json()
          console.log(`📥 RESPUESTA DEL SERVIDOR:`, result)

          // Agregar la URL principal (original) al array
          uploadedUrls.push(result.imageUrl)

          // 🆕 Agregar gallery thumbnail URL
          if (result.galleryThumbnailUrl) {
            galleryThumbnailUrls.push(result.galleryThumbnailUrl)
          }

          // Si es la primera imagen, guardar también la URL de miniatura para cards
          if (result.isFirstImage && result.thumbnailUrl) {
            thumbnailUrl = result.thumbnailUrl
            console.log(`🎯 PRIMERA IMAGEN PROCESADA CORRECTAMENTE:`)
            console.log(`   📸 Original para galería: ${result.imageUrl}`)
            console.log(`   🖼️ Thumbnail para cards: ${result.thumbnailUrl}`)
            console.log(`   🔍 Gallery thumbnail: ${result.galleryThumbnailUrl}`)
          }

          filesUploaded++
          setUploadProgress((filesUploaded / totalFiles) * 100)
        } catch (uploadError) {
          console.error(`❌ ERROR subiendo el archivo ${file.name}:`, uploadError)
          alert(
            `Error al subir la imagen ${file.name}. ${uploadError instanceof Error ? uploadError.message : "Error desconocido"}`,
          )
          setFormLoading(false)
          return
        }
      }

      console.log(`📋 RESUMEN DE SUBIDA:`)
      console.log(`   📸 URLs de imágenes originales:`, uploadedUrls)
      console.log(`   🔍 URLs de gallery thumbnails:`, galleryThumbnailUrls)
      console.log(`   🖼️ URL de thumbnail para cards:`, thumbnailUrl)

      const createdAt = Timestamp.now()
      const releaseDate = form.releaseDate ? Timestamp.fromDate(new Date(form.releaseDate)) : null

      const manufacturerDoc = await createManufacturerIfNotExists(form.brand)
      const normalizedLine = normalizeProductLine(form.line)
      const lineDoc = await createLineIfNotExists(normalizedLine, form.brand)

      // Crear el producto con todas las URLs
      const productData = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        imageUrls: uploadedUrls, // URLs originales para la galería principal
        galleryThumbnailUrls: galleryThumbnailUrls, // 🆕 URLs de miniaturas para galería
        brand: manufacturerDoc.name,
        line: lineDoc.name,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        createdAt,
        releaseDate,
        scale: form.scale || undefined,
        category: form.category || undefined,
        // Agregar URL de miniatura para cards si existe
        ...(thumbnailUrl && { thumbnailUrl }),
      }

      console.log(`💾 DATOS DEL PRODUCTO A GUARDAR:`, productData)

      await addProduct(productData)

      alert("✅ Producto agregado con éxito (3 versiones generadas: original + thumbnail + gallery thumbnail)")

      setForm({
        name: "",
        price: "",
        heightCm: "",
        description: "",
        brand: "",
        line: "",
        releaseDate: "",
        scale: "",
        category: "",
      })
      const fileInput = document.getElementById("images") as HTMLInputElement | null
      if (fileInput) fileInput.value = ""
      setFiles(null)
      setUploadProgress(0)
    } catch (error) {
      console.error("❌ ERROR COMPLETO en handleSubmit:", error)
      if (!(error instanceof Error && error.message.startsWith("Error al subir la imagen"))) {
        alert("Error al agregar producto. Revisa la consola para más detalles.")
      }
    } finally {
      setFormLoading(false)
    }
  }

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Verificando autenticación...</p>
      </div>
    )
  if (authError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <p>Error de autenticación: {authError.message}</p>
        <button onClick={() => router.push("/admin/login")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Ir a Login
        </button>
      </div>
    )
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Panel de Administración</h2>
            <p className="text-gray-600">Conectado como: {user.email}</p>
          </div>
          <button onClick={() => auth.signOut()} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Cerrar Sesión
          </button>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h1 className="text-2xl font-bold mb-6">Agregar Producto</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">🔍 NUEVA FUNCIONALIDAD</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ahora genera 3 versiones: Original + Thumbnail (300px) + Gallery Thumbnail (100px)</li>
              <li>• Gallery thumbnails son cuadradas de 100x100px para carga súper rápida</li>
              <li>• Revisa la consola para ver los logs detallados de cada versión</li>
            </ul>
          </div>

          {/* Resto del formulario sin cambios */}
          <div>
            <label className="block font-medium" htmlFor="name">
              Nombre
            </label>
            <input
              name="name"
              id="name"
              value={form.name}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium" htmlFor="price">
              Precio
            </label>
            <input
              name="price"
              id="price"
              type="number"
              value={form.price}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium" htmlFor="heightCm">
              Altura (cm)
            </label>
            <input
              name="heightCm"
              id="heightCm"
              type="number"
              value={form.heightCm}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium" htmlFor="scale">
              Escala
            </label>
            <input
              name="scale"
              id="scale"
              type="text"
              value={form.scale}
              onChange={handleInputChange}
              placeholder="1/6, 1/12..."
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label htmlFor="category" className="block font-medium">
              Categoría
            </label>
            <select
              name="category"
              id="category"
              value={form.category}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Selecciona una categoría</option>
              <option value="figura">Figura</option>
              <option value="plush">Peluche</option>
              <option value="accessory">Accesorio</option>
              <option value="otros">Otro</option>
            </select>
          </div>
          <div>
            <label className="block font-medium" htmlFor="description">
              Descripción
            </label>
            <textarea
              name="description"
              id="description"
              value={form.description}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              rows={3}
            />
          </div>
          <Combobox
            label="Fabricante"
            name="brand"
            value={form.brand}
            onChange={(val) => setForm({ ...form, brand: val })}
            options={brands}
            required
          />
          <Combobox
            label="Línea"
            name="line"
            value={form.line}
            onChange={(val) => setForm({ ...form, line: val })}
            options={lines}
            required
          />
          <div>
            <label htmlFor="releaseDate" className="block font-medium">
              Fecha de lanzamiento
            </label>
            <input
              name="releaseDate"
              id="releaseDate"
              type="date"
              value={form.releaseDate}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label htmlFor="images" className="block font-medium">
              Imágenes
            </label>
            <input
              id="images"
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-600 mt-1">
              🔍 Ahora genera 3 versiones automáticamente: Original + Thumbnail (300px) + Gallery Thumbnail (100px)
            </p>
          </div>
          {uploadProgress > 0 && (
            <div className="bg-blue-50 p-3 rounded">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>Subiendo imágenes...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {formLoading ? "Subiendo producto..." : "Agregar producto"}
          </button>
        </form>
      </div>
    </div>
  )
}
