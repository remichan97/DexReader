import { CollectionMetadataQuery } from '../queries/collections/collection-metadata.query'
import { CollectionQuery } from '../queries/collections/collection.query'

type CollectionMetadataRow = {
  id: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  mangaCount: number
  coverUrl: string | null
}

type CollectionJoinRow = {
  collections: {
    id: number
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
  }
  collection_items: {
    id: number
    collectionId: number
    mangaId: string
    addedAt: Date
    position: number | null
  }
}

export class CollectionMapper {
  static toCollectionWithMetadata(row: CollectionMetadataRow): CollectionMetadataQuery {
    return {
      id: row.id,
      name: row.name,
      descriptions: row.description ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      mangaCount: row.mangaCount,
      coverUrl: row.coverUrl ?? undefined
    }
  }

  static toCollectionQuery(row: CollectionJoinRow): CollectionQuery {
    return {
      id: row.collections.id,
      name: row.collections.name,
      descriptions: row.collections.description ?? undefined,
      createdAt: row.collections.createdAt,
      updatedAt: row.collections.updatedAt
    }
  }
}
