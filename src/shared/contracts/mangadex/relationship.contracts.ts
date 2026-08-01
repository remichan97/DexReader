import { RelationshipType } from '../../enums/mangadex'

export interface Relationship {
  id: string
  type: RelationshipType
  attributes?: Record<string, unknown>
}
