// src/lib/firebase/utils/slugify.ts

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Elimina acentos
    .replace(/\p{Diacritic}/gu, '') // Compatibilidad con Unicode
    .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales
    .replace(/\s+/g, '-') // Espacios por guiones
    .replace(/--+/g, '-') // Evita guiones dobles
    .replace(/^-+|-+$/g, ''); // Limpia extremos
}
