import { getAdminAuthHeaders } from "@/lib/api/admin-client"

async function sendPrizeLines(
  lines: string[],
  forceRefresh: boolean,
): Promise<Response> {
  const headers = await getAdminAuthHeaders(forceRefresh)
  if (!headers.Authorization) {
    throw new Error("Debes iniciar sesion como administrador.")
  }

  return fetch("/api/admin/category-rules/pricing", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lines }),
  })
}

export async function addPrizeCategoryLines(lines: string[]): Promise<string[]> {
  let response = await sendPrizeLines(lines, false)
  if (response.status === 401) {
    response = await sendPrizeLines(lines, true)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      payload?.error || `No se pudieron agregar las lineas (${response.status})`,
    )
  }

  return Array.isArray(payload?.submittedLines) ? payload.submittedLines : []
}
