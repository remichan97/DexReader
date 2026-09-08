import { RelationshipContract } from '../contracts/mangadex/relationship.contract'

export interface ApiResponse<T> {
  result: 'ok' | 'error'
  data: T
  relationship?: RelationshipContract[]
}
