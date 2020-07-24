/**
 * Returns an object with any keys provided omitted
 *
 * @param obj - The object to be modified
 * @param keys - A list of property names to exclude from the
 * new object
 *
 * @return An object excluding any keys passed in as arguments
 */
export function omit<T>(
  obj: Record<string, unknown> | string | number | T,
  keys: string[]
): Record<string, unknown> | string | number | T {
  if (!obj || Array.isArray(obj) || typeof obj !== 'object' || !keys) {
    return obj
  }

  return Object.entries(obj)
    .filter(([key]) => !keys.includes(key))
    .reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
}
