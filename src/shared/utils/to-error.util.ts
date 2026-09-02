/**
 * Normalise a value caught from a try/catch block into a real Error instance.
 * `catch` clauses type their binding as `unknown`, so anything can land here.
 */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
