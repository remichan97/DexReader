import { CollectionQuery } from './collection.query'

export interface CollectionMetadataQuery extends CollectionQuery {
  mangaCount: number
  coverUrl?: string
}
