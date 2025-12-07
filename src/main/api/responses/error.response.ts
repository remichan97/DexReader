export interface ErrorResponse {
  result: 'error'
  errors: Array<{
    id: string
    status: string
    title: string
    detail: string
  }>
}
