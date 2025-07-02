"use client"

import { useState, useCallback } from "react"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UploadedImage {
  imageUrl: string
  thumbnailUrl?: string
  galleryThumbnailUrl: string
  blurPlaceholder: string
  isFirstImage: boolean
  fileName: string
}

interface BatchUploadProps {
  onUploadComplete: (images: UploadedImage[]) => void
  maxFiles?: number
}

export default function BatchUpload({ onUploadComplete, maxFiles = 10 }: BatchUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")

  // Manejar selección de archivos
  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return

      const newFiles = Array.from(selectedFiles).slice(0, maxFiles)
      setFiles(newFiles)

      // Generar previews
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setPreviews(newPreviews)
      setUploadStatus("idle")
    },
    [maxFiles],
  )

  // Remover archivo individual
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      // Limpiar URL del preview
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Subir archivos
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadStatus("uploading")
    setProgress(0)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/batch-upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()

      setProgress(100)
      setUploadStatus("success")
      onUploadComplete(result.images)

      // Limpiar después de éxito
      setTimeout(() => {
        setFiles([])
        setPreviews((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url))
          return []
        })
        setProgress(0)
        setUploadStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus("error")
    } finally {
      setUploading(false)
    }
  }, [files, onUploadComplete])

  return (
    <div className="space-y-6">
      {/* Área de drop/selección */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="batch-file-input"
          disabled={uploading}
        />
        <label htmlFor="batch-file-input" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Selecciona múltiples imágenes</p>
          <p className="text-sm text-gray-500">Arrastra archivos aquí o haz clic para seleccionar (máx. {maxFiles})</p>
        </label>
      </div>

      {/* Preview de archivos seleccionados */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Archivos seleccionados ({files.length})</h3>
            {!uploading && (
              <Button onClick={handleUpload} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Subir todas las imágenes
              </Button>
            )}
          </div>

          {/* Grid de previews */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previews[index] || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Badge para primera imagen */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}

                {/* Botón remover */}
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Nombre del archivo */}
                <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar y status */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subiendo imágenes...</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Status messages */}
      {uploadStatus === "success" && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>¡Todas las imágenes se subieron correctamente!</span>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Error al subir las imágenes. Inténtalo de nuevo.</span>
        </div>
      )}
    </div>
  )
}
