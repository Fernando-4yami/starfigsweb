import { getAdminAuthHeaders } from "@/lib/api/admin-client"

export interface AdminImageUploadResult {
  success: true
  imageUrl: string
  thumbnailUrl?: string
  galleryThumbnailUrl: string
  blurPlaceholder: string
  isFirstImage: boolean
}

async function readErrorMessage(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null)
  const serverMessage = payload?.details || payload?.error

  if (response.status === 401) {
    return "Tu sesión expiró. Vuelve a iniciar sesión e inténtalo otra vez."
  }
  if (response.status === 403) {
    return "Tu cuenta no tiene permiso para subir imágenes."
  }

  return serverMessage || `No se pudo subir la imagen (${response.status})`
}

async function sendImage(
  file: File,
  isFirstImage: boolean,
  forceRefresh: boolean,
): Promise<Response> {
  const headers = await getAdminAuthHeaders(forceRefresh)
  if (!headers.Authorization) {
    throw new Error("Debes iniciar sesión como administrador para subir imágenes.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("isFirstImage", String(isFirstImage))

  return fetch("/api/upload-image", {
    method: "POST",
    headers,
    body: formData,
  })
}

export async function uploadAdminImage(
  file: File,
  isFirstImage: boolean,
): Promise<AdminImageUploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} no es un archivo de imagen válido.`)
  }

  let response = await sendImage(file, isFirstImage, false)
  if (response.status === 401) {
    response = await sendImage(file, isFirstImage, true)
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json()
}
