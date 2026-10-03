import { manga } from '../schemas'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { collectionRepo } from './collection.repo'

function insertTestManga(mangaId: string): void {
  const now = new Date()
  testDb
    .insert(manga)
    .values({
      mangaId,
      title: `Title ${mangaId}`,
      addedAt: now,
      updatedAt: now,
      lastAccessedAt: now
    })
    .run()
}

describe('CollectionRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('createCollection / getCollectionById', () => {
    it('persists a collection and reads it back', () => {
      const id = collectionRepo.createCollection({ name: 'Favourites', description: 'My picks' })

      const result = collectionRepo.getCollectionById(id)

      expect(result).toEqual(
        expect.objectContaining({ id, name: 'Favourites', description: 'My picks' })
      )
    })

    it('returns undefined for a non-existent collection', () => {
      expect(collectionRepo.getCollectionById(999)).toBeUndefined()
    })

    it('rejects a duplicate name (unique constraint)', () => {
      collectionRepo.createCollection({ name: 'Favourites' })

      expect(() => collectionRepo.createCollection({ name: 'Favourites' })).toThrow()
    })
  })

  describe('batchCreateCollections', () => {
    it('creates every collection and returns their ids in order', () => {
      const ids = collectionRepo.batchCreateCollections([
        { name: 'A' },
        { name: 'B' },
        { name: 'C' }
      ])

      expect(ids).toHaveLength(3)
      expect(
        collectionRepo
          .getAllCollections()
          .map((c) => c.name)
          .sort()
      ).toEqual(['A', 'B', 'C'])
    })
  })

  describe('updateCollection', () => {
    it('updates the name and description of the matching collection only', () => {
      const targetId = collectionRepo.createCollection({ name: 'Old name' })
      const otherId = collectionRepo.createCollection({ name: 'Untouched' })

      collectionRepo.updateCollection({ id: targetId, name: 'New name', description: 'Updated' })

      expect(collectionRepo.getCollectionById(targetId)).toEqual(
        expect.objectContaining({ name: 'New name', description: 'Updated' })
      )
      expect(collectionRepo.getCollectionById(otherId)?.name).toBe('Untouched')
    })
  })

  describe('deleteCollection', () => {
    it('removes the collection and cascades to its items', () => {
      insertTestManga('manga-1')
      const collectionId = collectionRepo.createCollection({ name: 'Doomed' })
      collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      collectionRepo.deleteCollection(collectionId)

      expect(collectionRepo.getCollectionById(collectionId)).toBeUndefined()
      expect(collectionRepo.getAllCollectionItems()).toEqual([])
    })
  })

  describe('addToCollection', () => {
    it('adds a manga to a collection and returns true', () => {
      insertTestManga('manga-1')
      const collectionId = collectionRepo.createCollection({ name: 'Reading' })

      const added = collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      expect(added).toBe(true)
      expect(collectionRepo.getMangaInCollection(collectionId)).toEqual(['manga-1'])
    })

    it('returns false without throwing when the manga is already in the collection', () => {
      insertTestManga('manga-1')
      const collectionId = collectionRepo.createCollection({ name: 'Reading' })
      collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      const addedAgain = collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      expect(addedAgain).toBe(false)
      expect(collectionRepo.getMangaInCollection(collectionId)).toEqual(['manga-1'])
    })
  })

  describe('batchAddToCollection', () => {
    it('adds every manga, silently skipping ones already in the collection', () => {
      insertTestManga('manga-1')
      insertTestManga('manga-2')
      const collectionId = collectionRepo.createCollection({ name: 'Reading' })
      collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      collectionRepo.batchAddToCollection([
        { collectionId, mangaId: 'manga-1' },
        { collectionId, mangaId: 'manga-2' }
      ])

      expect(collectionRepo.getMangaInCollection(collectionId).sort()).toEqual([
        'manga-1',
        'manga-2'
      ])
    })
  })

  describe('removeFromCollection', () => {
    it('removes only the requested collection/manga pairs', () => {
      insertTestManga('manga-1')
      insertTestManga('manga-2')
      const collectionId = collectionRepo.createCollection({ name: 'Reading' })
      collectionRepo.batchAddToCollection([
        { collectionId, mangaId: 'manga-1' },
        { collectionId, mangaId: 'manga-2' }
      ])

      collectionRepo.removeFromCollection([{ collectionId, mangaId: 'manga-1' }])

      expect(collectionRepo.getMangaInCollection(collectionId)).toEqual(['manga-2'])
    })
  })

  describe('getAllCollectionsWithMetadata', () => {
    it('computes manga count and a cover url for each collection', () => {
      insertTestManga('manga-1')
      testDb.update(manga).set({ coverUrl: 'https://example.com/cover.jpg' }).run()
      const collectionId = collectionRepo.createCollection({ name: 'Reading' })
      collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      const [result] = collectionRepo.getAllCollectionsWithMetadata()

      expect(result).toEqual(
        expect.objectContaining({
          id: collectionId,
          mangaCount: 1,
          coverUrl: 'https://example.com/cover.jpg'
        })
      )
    })

    it('reports a zero manga count and no cover for an empty collection', () => {
      collectionRepo.createCollection({ name: 'Empty' })

      const [result] = collectionRepo.getAllCollectionsWithMetadata()

      expect(result).toEqual(expect.objectContaining({ mangaCount: 0, coverUrl: undefined }))
    })
  })

  describe('getCollectionByManga', () => {
    it('returns every collection that contains the given manga', () => {
      insertTestManga('manga-1')
      const collectionId = collectionRepo.createCollection({ name: 'Reading' })
      collectionRepo.createCollection({ name: 'Unrelated' })
      collectionRepo.addToCollection({ collectionId, mangaId: 'manga-1' })

      const results = collectionRepo.getCollectionByManga('manga-1')

      expect(results).toEqual([expect.objectContaining({ id: collectionId, name: 'Reading' })])
    })
  })
})
