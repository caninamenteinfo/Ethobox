/**
 * La IA no siempre devuelve exactamente la forma esperada (p. ej. un campo
 * lista puede llegar como una única cadena). Antes de recorrer un array con
 * .map()/.join() en la UI, se pasa por aquí para no romper el render.
 */
export function asArray<T = string>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim()) return [value] as unknown as T[];
  return [];
}
