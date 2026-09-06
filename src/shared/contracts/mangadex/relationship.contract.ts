import { RelationshipType } from '@shared/enums/mangadex'

export interface RelationshipContract {
  id: string
  type: RelationshipType
  attributes?: Record<string, unknown>
}
