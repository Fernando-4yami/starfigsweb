import { getAdminAuthHeaders } from "@/lib/api/admin-client"

export interface AdminCatalogOptions {
  brands: string[]
  lines: string[]
}

export async function fetchAdminCatalogOptions(): Promise<AdminCatalogOptions> {
  const headers = await getAdminAuthHeaders()
  const response = await fetch("/api/admin/options", {
    headers,
    cache: "force-cache",
  })

  if (!response.ok) {
    throw new Error(`Admin options request failed: ${response.status}`)
  }

  return response.json()
}
