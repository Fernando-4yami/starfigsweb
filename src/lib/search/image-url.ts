const FIREBASE_IMAGE_PREFIX =
  "https://firebasestorage.googleapis.com/v0/b/starfigs-29d31/o/"
const GOOGLE_STORAGE_IMAGE_PREFIX =
  "https://storage.googleapis.com/starfigs-29d31/"

export function compactImageUrl(value: unknown): string | null {
  const url = typeof value === "string" ? value : ""
  if (!url) return null
  if (url.startsWith(FIREBASE_IMAGE_PREFIX)) {
    return `~${url.slice(FIREBASE_IMAGE_PREFIX.length)}`
  }
  if (url.startsWith(GOOGLE_STORAGE_IMAGE_PREFIX)) {
    return `!${url.slice(GOOGLE_STORAGE_IMAGE_PREFIX.length)}`
  }
  return url
}

export function expandImageUrl(value: string | null): string | null {
  if (!value) return null
  if (value.startsWith("~")) return `${FIREBASE_IMAGE_PREFIX}${value.slice(1)}`
  if (value.startsWith("!")) return `${GOOGLE_STORAGE_IMAGE_PREFIX}${value.slice(1)}`
  return value
}
