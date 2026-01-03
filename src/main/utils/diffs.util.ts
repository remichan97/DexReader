export function getChangedFields<T>(
  current: T,
  incoming: T,
  comparingFields: (keyof T)[]
): Partial<T> | undefined {
  const changes: Partial<T> = {}
  let hasChanged = false

  for (const field of comparingFields) {
    if (!isEqual(current[field], incoming[field])) {
      changes[field] = incoming[field]
      hasChanged = true
    }
  }

  return hasChanged ? changes : undefined
}

function isEqual(a: unknown, b: unknown): boolean {
  // Primitive types and reference equality
  if (a === b) return true

  // Null/undefined check
  if (a == null || b == null) return a === b

  // Arrays check
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, index) => isEqual(val, b[index]))
  }

  // Date checks:
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Finally, objects check
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as Record<string, unknown>)
    const bKeys = Object.keys(b as Record<string, unknown>)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) =>
      isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    )
  }

  return false
}
