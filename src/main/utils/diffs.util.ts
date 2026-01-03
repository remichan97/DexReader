export function getChangedFields<T extends Record<string, unknown>>(
  current: T,
  incoming: T,
  comparingFields: (keyof T)[]
): Partial<T> | undefined {
  const changes: Partial<T> = {}
  let hasChanged = false

  for (const field of comparingFields) {
    if (current[field] !== incoming[field]) {
      changes[field] = incoming[field]
      hasChanged = true
    }
  }

  return hasChanged ? changes : undefined
}
