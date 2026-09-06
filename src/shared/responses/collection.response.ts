export interface CollectionResponse<T> {
  result: 'ok' | 'error'
  response?: string
  data: T[]
  limit: number
  offset: number
  total: number
}
