import { getAdminAuthHeaders } from "@/lib/api/admin-client"

async function sendRevalidation(
  slug: string,
  forceRefresh: boolean,
): Promise<Response> {
  const headers = await getAdminAuthHeaders(forceRefresh)
  if (!headers.Authorization) {
    throw new Error("Debes iniciar sesion como administrador.")
  }

  return fetch("/api/admin/revalidate-product", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slug }),
  })
}

export async function revalidateAdminProduct(slug: string): Promise<void> {
  let response = await sendRevalidation(slug, false)
  if (response.status === 401) {
    response = await sendRevalidation(slug, true)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(
      payload?.error || `No se pudo actualizar la ficha publica (${response.status})`,
    )
  }
}
