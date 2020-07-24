/**
 * Creates a function to filter values from a list
 *
 * @param excludeList - A list of keys to be filtered
 *
 * @return A function that can be passed a value that will
 * be excluded if it is contained in the exclude list. If the
 * value passed to the function is an array, it will use the
 * first value only. This is useful in conjuntion with
 * Object.entries to filter out specific keys
 */
export function filterFromList(
  excludeList: string[]
): (value: string | [string, unknown]) => boolean {
  return (value) => {
    if (Array.isArray(value)) {
      return !excludeList.includes(value[0])
    }

    return !excludeList.includes(value)
  }
}
