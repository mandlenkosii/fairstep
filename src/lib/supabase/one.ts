/** A one-to-one join can come back as an object or a one-item array; this always gives the row or null. */
export function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}
