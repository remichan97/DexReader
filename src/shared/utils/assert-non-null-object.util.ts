/**
 * Assert that `value` is a non-null object, narrowing it to `T` for the caller.
 *
 * This only checks what's true of any object regardless of shape - `typeof value ===
 * 'object' && value !== null`. Generics are erased at runtime, so there is no way to
 * check individual properties of `T` here; callers still validate each field of `T`
 * themselves after calling this, same as before.
 */
export function assertNonNullObject<T>(value: unknown, message: string): asserts value is T {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(message)
  }
}
