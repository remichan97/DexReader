import { CollectionMapper } from './collection.mapper'
import { collectionItems, collections } from '../schemas'

type CollectionMetadataRow = Parameters<typeof CollectionMapper.toCollectionWithMetadata>[0]
type CollectionRow = typeof collections.$inferSelect
type CollectionItemsRow = typeof collectionItems.$inferSelect

function metadataRow(overrides: Partial<CollectionMetadataRow> = {}): CollectionMetadataRow {
  return {
    id: 1,
    name: 'Favourites',
    description: 'My favourites',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    mangaCount: 5,
    coverUrl: 'https://example.com/cover.jpg',
    ...overrides
  }
}

function collectionRow(overrides: Partial<CollectionRow> = {}): CollectionRow {
  return {
    id: 1,
    name: 'Favourites',
    description: 'My favourites',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides
  }
}

function collectionItemRow(overrides: Partial<CollectionItemsRow> = {}): CollectionItemsRow {
  return {
    id: 1,
    collectionId: 1,
    mangaId: 'manga-1',
    addedAt: new Date('2026-01-01T00:00:00.000Z'),
    position: 2,
    ...overrides
  }
}

describe('toCollectionWithMetadata', () => {
  it('maps a collection with its manga count and cover', () => {
    const result = CollectionMapper.toCollectionWithMetadata(metadataRow())

    expect(result).toEqual({
      id: 1,
      name: 'Favourites',
      description: 'My favourites',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      mangaCount: 5,
      coverUrl: 'https://example.com/cover.jpg'
    })
  })

  it('falls back to undefined for a missing description or cover', () => {
    const result = CollectionMapper.toCollectionWithMetadata(
      metadataRow({ description: null, coverUrl: null })
    )

    expect(result.description).toBeUndefined()
    expect(result.coverUrl).toBeUndefined()
  })
})

describe('toCollectionQuery', () => {
  it('maps a plain collections-table row', () => {
    const result = CollectionMapper.toCollectionQuery(collectionRow())

    expect(result).toEqual({
      id: 1,
      name: 'Favourites',
      description: 'My favourites',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z')
    })
  })

  it('falls back to undefined for a missing description on a plain row', () => {
    const result = CollectionMapper.toCollectionQuery(collectionRow({ description: null }))

    expect(result.description).toBeUndefined()
  })

  it('maps a JOIN result by reaching into its collections sub-object', () => {
    const result = CollectionMapper.toCollectionQuery({
      collections: {
        id: 2,
        name: 'Plan to Read',
        description: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z')
      },
      collection_items: {
        id: 1,
        collectionId: 2,
        mangaId: 'manga-1',
        addedAt: new Date('2026-01-01T00:00:00.000Z'),
        position: 0
      }
    })

    expect(result).toEqual({
      id: 2,
      name: 'Plan to Read',
      description: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z')
    })
  })
})

describe('toCollectionItemQuery', () => {
  it('maps a collection item row', () => {
    const result = CollectionMapper.toCollectionItemQuery(collectionItemRow())

    expect(result).toEqual({
      id: 1,
      collectionId: 1,
      mangaId: 'manga-1',
      addedAt: new Date('2026-01-01T00:00:00.000Z'),
      position: 2
    })
  })

  it('falls back to position 0 when position is null', () => {
    const result = CollectionMapper.toCollectionItemQuery(collectionItemRow({ position: null }))

    expect(result.position).toBe(0)
  })
})
