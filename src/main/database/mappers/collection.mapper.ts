import { CollectionMetadataQuery } from '../queries/collections/collection-metadata.query'

type CollectionMetadataRow = {
  id: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  mangaCount: number
  coverUrl: string | null
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
}
