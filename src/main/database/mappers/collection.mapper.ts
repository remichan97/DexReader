import { CollectionItemQuery } from '../queries/collections/collection-item.query'
import { CollectionMetadataQuery } from '../queries/collections/collection-metadata.query'
import { CollectionQuery } from '../queries/collections/collection.query'
import { collectionItems, collections } from '../schema'

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

type CollectionRow = typeof collections.$inferSelect
type CollectionItemsRow = typeof collectionItems.$inferSelect

export class CollectionMapper {
  static toCollectionWithMetadata(row: CollectionMetadataRow): CollectionMetadataQuery {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      mangaCount: row.mangaCount,
      coverUrl: row.coverUrl ?? undefined
    }
  }

  static toCollectionQuery(row: CollectionJoinRow): CollectionQuery
  static toCollectionQuery(row: CollectionRow): CollectionQuery
  static toCollectionQuery(row: CollectionJoinRow | CollectionRow): CollectionQuery {
    // Type guard: Check if it's a JOIN result
    if ('collections' in row) {
      return {
        id: row.collections.id,
        name: row.collections.name,
        description: row.collections.description ?? undefined,
        createdAt: row.collections.createdAt,
        updatedAt: row.collections.updatedAt
      }
    } else {
      // Simple row from collections table
      return {
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }
    }
  }

  static toCollectionItemQuery(row: CollectionItemsRow): CollectionItemQuery {
    return {
      id: row.id,
      collectionId: row.collectionId,
      mangaId: row.mangaId,
      addedAt: row.addedAt,
      position: row.position ?? 0
    }
  }
}
