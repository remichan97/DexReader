export interface ErrorResponse {
  result: 'error'
  errors: Array<{
    id: string
    status: string
    title: string
    detail: string
  }>
}

export function isMangaDexErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return candidate.result === 'error' && Array.isArray(candidate.errors)
}
