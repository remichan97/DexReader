import { CollectionItemContract } from '@shared/contracts/database/collections/collection-item.contract'
import { CollectionMetadataContract } from '@shared/contracts/database/collections/collection-metadata.contract'
import { CollectionContract } from '@shared/contracts/database/collections/collection.contract'
import { collectionItems, collections } from '../schemas'

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
  static toCollectionWithMetadata(row: CollectionMetadataRow): CollectionMetadataContract {
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

  static toCollectionQuery(row: CollectionJoinRow): CollectionContract
  static toCollectionQuery(row: CollectionRow): CollectionContract
  static toCollectionQuery(row: CollectionJoinRow | CollectionRow): CollectionContract {
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

  static toCollectionItemQuery(row: CollectionItemsRow): CollectionItemContract {
    return {
      id: row.id,
      collectionId: row.collectionId,
      mangaId: row.mangaId,
      addedAt: row.addedAt,
      position: row.position ?? 0
    }
  }
}
