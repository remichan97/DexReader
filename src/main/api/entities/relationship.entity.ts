import { RelationshipType } from '../enums/relationship-type.enum'

export interface Relationship {
  id: string
  type: RelationshipType
  attributes?: Record<string, unknown>
}
