import fs from 'node:fs/promises'
import {
  chapter,
  chapterDownloads,
  chapterProgress,
  collectionItems,
  collections,
  manga,
  mangaProgress,
  mangaReaderOverrides,
  readHistory,
  searchPresets
} from '../schemas'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

vi.mock('../../filesystem/path-validator', () => ({
  getAppDataPath: vi.fn(() => '/mock/app-data')
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

import { cleanupRepo } from './cleanup.repo'
import { readingRepo } from './reading-stats.repo'

function seedEveryTable(): void {
  const now = new Date()

  testDb
    .insert(manga)
    .values({
      mangaId: 'manga-1',
      title: 'Title',
      addedAt: now,
      updatedAt: now,
      lastAccessedAt: now
    })
    .run()
  testDb
    .insert(chapter)
    .values({
      chapterId: 'ch-1',
      mangaId: 'manga-1',
      language: 'en',
      publishAt: now,
      createdAt: now,
      updatedAt: now
    })
    .run()
  testDb
    .insert(chapterDownloads)
    .values({
      chapterId: 'ch-1',
      mangaId: 'manga-1',
      downloadsBasePath: '/downloads',
      filePath: '/downloads/ch-1.cbz',
      totalPages: 10
    })
    .run()
  testDb
    .insert(mangaProgress)
    .values({ mangaId: 'manga-1', lastChapterId: 'ch-1', firstReadAt: now, lastReadAt: now })
    .run()
  testDb
    .insert(chapterProgress)
    .values({ mangaId: 'manga-1', chapterId: 'ch-1', currentPage: 1, lastReadAt: now })
    .run()
  const collectionId = testDb
    .insert(collections)
    .values({ name: 'Reading', createdAt: now, updatedAt: now })
    .returning({ id: collections.id })
    .get().id
  testDb.insert(collectionItems).values({ collectionId, mangaId: 'manga-1', addedAt: now }).run()
  testDb.insert(readHistory).values({ mangaId: 'manga-1', chapterId: 'ch-1', readAt: now }).run()
  testDb
    .insert(mangaReaderOverrides)
    .values({
      mangaId: 'manga-1',
      settings: { readingMode: 'single' as never },
      createdAt: now,
      updatedAt: now
    })
    .run()
  testDb
    .insert(searchPresets)
    .values({
      name: 'Preset',
      filters: {} as never,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now
    })
    .run()
  readingRepo.calculateStatistics()
}

describe('CleanUpRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('clearAllData', () => {
    it('empties every table without violating foreign key constraints', () => {
      seedEveryTable()

      expect(() => cleanupRepo.clearAllData()).not.toThrow()

      expect(testDb.select().from(manga).all()).toEqual([])
      expect(testDb.select().from(chapter).all()).toEqual([])
      expect(testDb.select().from(chapterDownloads).all()).toEqual([])
      expect(testDb.select().from(mangaProgress).all()).toEqual([])
      expect(testDb.select().from(chapterProgress).all()).toEqual([])
      expect(testDb.select().from(collections).all()).toEqual([])
      expect(testDb.select().from(collectionItems).all()).toEqual([])
      expect(testDb.select().from(readHistory).all()).toEqual([])
      expect(testDb.select().from(mangaReaderOverrides).all()).toEqual([])
      expect(testDb.select().from(searchPresets).all()).toEqual([])
      expect(readingRepo.getStats()).toEqual({
        totalMangaRead: 0,
        totalChaptersRead: 0,
        totalPagesRead: 0,
        totalEstimatedMinutesRead: 0
      })
    })

    it('resets autoincrement counters, so new rows start from id 1 again', () => {
      const now = new Date()
      testDb.insert(collections).values({ name: 'Old', createdAt: now, updatedAt: now }).run()

      cleanupRepo.clearAllData()

      const newId = testDb
        .insert(collections)
        .values({ name: 'New', createdAt: now, updatedAt: now })
        .returning({ id: collections.id })
        .get().id
      expect(newId).toBe(1)
    })

    it('is a no-op on an already-empty database', () => {
      expect(() => cleanupRepo.clearAllData()).not.toThrow()
    })
  })

  describe('reclaimStorage', () => {
    it('returns the byte difference between the before and after database file size', async () => {
      vi.spyOn(fs, 'stat')
        .mockResolvedValueOnce({ size: 1000 } as never)
        .mockResolvedValueOnce({ size: 800 } as never)

      const reclaimed = await cleanupRepo.reclaimStorage()

      expect(reclaimed).toBe(200)
    })

    it('returns 0 without throwing when the database file cannot be read', async () => {
      vi.spyOn(fs, 'stat').mockRejectedValue(new Error('ENOENT'))

      await expect(cleanupRepo.reclaimStorage()).resolves.toBe(0)
    })
  })
})
