import { auth } from "@/lib/firebase/auth-client"

export async function getAdminAuthHeaders(
  forceRefresh = false,
): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken(forceRefresh)
  return token ? { Authorization: `Bearer ${token}` } : {}
}
