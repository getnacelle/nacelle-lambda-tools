/**
 * Recursively removes any keys with falsey values
 *
 * @param obj - The object with keys that should be excluded
 *
 * @return An object where any falsey key / value pairs are
 * excluded
 */
export function removeEmptyKeys(
  obj: Record<string, unknown> | string | number | unknown
): Record<string, unknown> | unknown {
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  return Object.entries(obj)
    .filter(([, value]) => value)
    .reduce(
      (newObject, [key, value]) => ({
        ...newObject,
        [key]:
          typeof value === 'object'
            ? removeEmptyKeys(<Record<string, unknown>>value)
            : value,
      }),
      {}
    )
}
