import { Relationship } from '../entities/relationship.entity'

export interface ApiResponse<T> {
  result: 'ok' | 'error'
  data: T
  relationship?: Relationship[]
}
