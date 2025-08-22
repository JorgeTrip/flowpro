/**
 * Convierte un texto a formato de oración (primera letra en mayúscula, resto en minúsculas)
 * @param text Texto a normalizar
 * @returns Texto en formato de oración
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  return text.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normaliza un texto para comparación, eliminando espacios y convirtiendo a minúsculas
 * @param text Texto a normalizar
 * @returns Texto normalizado para comparación
 */
export function normalizeForComparison(text: string): string {
  if (!text) return '';
  return text.trim().toLowerCase();
}

/**
 * Normaliza un nombre de vendedor, asegurando que cada parte del nombre comience con mayúscula
 * @param name Nombre del vendedor
 * @returns Nombre normalizado
 */
export function normalizeVendedorName(name: string): string {
  if (!name) return '';
  return name.split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
