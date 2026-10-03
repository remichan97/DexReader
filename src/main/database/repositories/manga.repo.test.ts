import { eq } from 'drizzle-orm'
import { chapter, chapterDownloads, collectionItems, collections, manga } from '../schemas'
import { PublicationStatus } from '@shared/enums/mangadex'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { mangaRepo } from './manga.repo'

function mangaCommand(overrides: Partial<UpsertMangaCommand> = {}): UpsertMangaCommand {
  return {
    mangaId: 'manga-1',
    title: 'Test Manga',
    coverUrl: 'https://example.com/cover.jpg',
    status: PublicationStatus.Ongoing,
    authors: ['Author A'],
    artists: ['Artist A'],
    tags: ['Action'],
    ...overrides
  }
}

function insertTestChapter(chapterId: string, mangaId: string): void {
  const now = new Date()
  testDb
    .insert(chapter)
    .values({ chapterId, mangaId, language: 'en', publishAt: now, createdAt: now, updatedAt: now })
    .run()
}

function insertTestDownload(
  chapterId: string,
  mangaId: string,
  status: DownloadStatus = DownloadStatus.Completed
): void {
  testDb
    .insert(chapterDownloads)
    .values({
      chapterId,
      mangaId,
      status,
      downloadsBasePath: '/downloads',
      filePath: '/downloads/file.cbz',
      totalPages: 10
    })
    .run()
}

function setLastAccessedAt(mangaId: string, date: Date): void {
  testDb.update(manga).set({ lastAccessedAt: date }).where(eq(manga.mangaId, mangaId)).run()
}

describe('MangaRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('upsertManga', () => {
    it('inserts a new manga row', () => {
      mangaRepo.upsertManga(mangaCommand())

      expect(mangaRepo.getMangaById('manga-1')).toEqual(
        expect.objectContaining({ mangaId: 'manga-1', title: 'Test Manga' })
      )
    })

    it('updates an existing row on conflict, without resetting addedAt', () => {
      mangaRepo.upsertManga(mangaCommand())
      const originalAddedAt = testDb
        .select({ addedAt: manga.addedAt })
        .from(manga)
        .where(eq(manga.mangaId, 'manga-1'))
        .get()?.addedAt

      mangaRepo.upsertManga(mangaCommand({ title: 'Renamed Manga' }))

      const row = testDb.select().from(manga).where(eq(manga.mangaId, 'manga-1')).get()
      expect(row?.title).toBe('Renamed Manga')
      expect(row?.addedAt).toEqual(originalAddedAt)
    })

    it('does not overwrite isFavourite on a re-upsert when omitted', () => {
      mangaRepo.upsertManga(mangaCommand())
      mangaRepo.toggleFavourite('manga-1')

      mangaRepo.upsertManga(mangaCommand({ title: 'Refetched title' }))

      expect(mangaRepo.getMangaById('manga-1')?.isFavourite).toBe(true)
    })
  })

  describe('batchUpsertManga', () => {
    it('inserts every manga via the single-item path when only one is given', () => {
      mangaRepo.batchUpsertManga([mangaCommand({ mangaId: 'manga-1' })])

      expect(mangaRepo.getAllManga()).toHaveLength(1)
    })

    it('inserts and updates via the transaction path when more than one is given', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-1', title: 'Original' }))

      mangaRepo.batchUpsertManga([
        mangaCommand({ mangaId: 'manga-1', title: 'Updated via batch' }),
        mangaCommand({ mangaId: 'manga-2', title: 'Brand new' })
      ])

      expect(
        mangaRepo
          .getAllManga()
          .map((m) => m.title)
          .sort()
      ).toEqual(['Brand new', 'Updated via batch'])
    })
  })

  describe('toggleFavourite', () => {
    it('flips isFavourite and returns the new value', () => {
      mangaRepo.upsertManga(mangaCommand())

      expect(mangaRepo.toggleFavourite('manga-1')).toBe(true)
      expect(mangaRepo.toggleFavourite('manga-1')).toBe(false)
    })

    it('throws for a manga that does not exist', () => {
      expect(() => mangaRepo.toggleFavourite('missing')).toThrow(/not found/i)
    })
  })

  describe('updateCoverCachedDate / clearCachedCoverDate', () => {
    it('sets coverCachedAt for the given manga only', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-1' }))
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-2' }))

      mangaRepo.updateCoverCachedDate(['manga-1'])

      const rows = mangaRepo.getAllManga()
      expect(rows.find((m) => m.mangaId === 'manga-1')?.coverCachedAt).toBeInstanceOf(Date)
      expect(rows.find((m) => m.mangaId === 'manga-2')?.coverCachedAt).toBeNull()
    })

    it('clears coverCachedAt for specific manga when ids are given', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-1' }))
      mangaRepo.updateCoverCachedDate(['manga-1'])

      mangaRepo.clearCachedCoverDate(['manga-1'])

      expect(mangaRepo.getMangaById('manga-1')?.updatedAt).toBeInstanceOf(Date)
      const row = testDb.select().from(manga).where(eq(manga.mangaId, 'manga-1')).get()
      expect(row?.coverCachedAt).toBeNull()
    })

    it('clears coverCachedAt for all manga when no ids are given', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-1' }))
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-2' }))
      mangaRepo.updateCoverCachedDate(['manga-1', 'manga-2'])

      mangaRepo.clearCachedCoverDate()

      const rows = testDb.select().from(manga).all()
      expect(rows.every((row) => row.coverCachedAt === null)).toBe(true)
    })

    it('does nothing when given an empty array of ids', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'manga-1' }))
      mangaRepo.updateCoverCachedDate(['manga-1'])

      mangaRepo.clearCachedCoverDate([])

      const row = testDb.select().from(manga).where(eq(manga.mangaId, 'manga-1')).get()
      expect(row?.coverCachedAt).not.toBeNull()
    })
  })

  describe('getLibraryManga', () => {
    it('with no options, returns only favourited manga with their completed download count', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'fav', title: 'Favourited' }))
      mangaRepo.toggleFavourite('fav')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'not-fav', title: 'Not favourited' }))
      insertTestChapter('ch-1', 'fav')
      insertTestDownload('ch-1', 'fav', DownloadStatus.Completed)

      const results = mangaRepo.getLibraryManga()

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual(
        expect.objectContaining({ mangaId: 'fav', hasDownloads: true, downloadedChapterCount: 1 })
      )
    })

    it('filters by search title', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm1', title: 'One Piece' }))
      mangaRepo.toggleFavourite('m1')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm2', title: 'Naruto' }))
      mangaRepo.toggleFavourite('m2')

      const results = mangaRepo.getLibraryManga({ search: 'piece' })

      expect(results.map((r) => r.mangaId)).toEqual(['m1'])
    })

    it('includes non-favourited manga with completed downloads when includeDownloaded is set', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'downloaded-only', title: 'Downloaded' }))
      insertTestChapter('ch-1', 'downloaded-only')
      insertTestDownload('ch-1', 'downloaded-only', DownloadStatus.Completed)

      const withoutFlag = mangaRepo.getLibraryManga({})
      const withFlag = mangaRepo.getLibraryManga({ includeDownloaded: true })

      expect(withoutFlag).toHaveLength(0)
      expect(withFlag.map((r) => r.mangaId)).toEqual(['downloaded-only'])
    })

    it('respects limit and offset', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm1', title: 'A' }))
      mangaRepo.toggleFavourite('m1')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm2', title: 'B' }))
      mangaRepo.toggleFavourite('m2')

      const page1 = mangaRepo.getLibraryManga({ limit: 1, offset: 0 })
      const page2 = mangaRepo.getLibraryManga({ limit: 1, offset: 1 })

      expect(page1).toHaveLength(1)
      expect(page2).toHaveLength(1)
      expect(page1[0].mangaId).not.toBe(page2[0].mangaId)
    })
  })

  describe('getDownloadedManga', () => {
    it('returns manga with at least one completed download, favourited or not', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'downloaded' }))
      insertTestChapter('ch-1', 'downloaded')
      insertTestDownload('ch-1', 'downloaded', DownloadStatus.Completed)
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'queued-only' }))
      insertTestChapter('ch-2', 'queued-only')
      insertTestDownload('ch-2', 'queued-only', DownloadStatus.Queued)

      const results = mangaRepo.getDownloadedManga()

      expect(results.map((r) => r.mangaId)).toEqual(['downloaded'])
    })
  })

  describe('getLibraryMangaByCustomCondition', () => {
    it('only returns favourited manga even when other fields match', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm1', authors: ['Oda'] }))
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm2', authors: ['Oda'] }))
      mangaRepo.toggleFavourite('m2')

      const results = mangaRepo.getLibraryMangaByCustomCondition({ author: 'Oda' })

      expect(results.map((r) => r.mangaId)).toEqual(['m2'])
    })

    it('filters by tag', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm1', tags: ['Romance'] }))
      mangaRepo.toggleFavourite('m1')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm2', tags: ['Horror'] }))
      mangaRepo.toggleFavourite('m2')

      const results = mangaRepo.getLibraryMangaByCustomCondition({ tag: 'Romance' })

      expect(results.map((r) => r.mangaId)).toEqual(['m1'])
    })
  })

  describe('getMangaById', () => {
    it('returns undefined for a manga that does not exist', () => {
      expect(mangaRepo.getMangaById('missing')).toBeUndefined()
    })
  })

  describe('statsMangaTable', () => {
    it('classifies manga into favourite, downloaded, browsing-cache, and old-cache buckets', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'fav' }))
      mangaRepo.toggleFavourite('fav')

      mangaRepo.upsertManga(mangaCommand({ mangaId: 'downloaded' }))
      insertTestChapter('ch-1', 'downloaded')
      insertTestDownload('ch-1', 'downloaded', DownloadStatus.Completed)

      mangaRepo.upsertManga(mangaCommand({ mangaId: 'recent-cache' }))

      mangaRepo.upsertManga(mangaCommand({ mangaId: 'old-cache' }))
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)
      setLastAccessedAt('old-cache', oldDate)

      const stats = mangaRepo.statsMangaTable()

      expect(stats).toEqual({
        totalManga: 4,
        totalFavouriteManga: 1,
        downloadedManga: 1,
        browsingCache: 2, // recent-cache + old-cache: non-favourite, non-downloaded
        oldCache: 1 // only old-cache is also past the 90-day threshold
      })
    })
  })

  describe('cleanupMangaCache', () => {
    it('deletes non-favourite, non-downloaded manga past the 90-day threshold', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'old' }))
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)
      setLastAccessedAt('old', oldDate)

      mangaRepo.upsertManga(mangaCommand({ mangaId: 'recent' }))

      const deletedCount = mangaRepo.cleanupMangaCache()

      expect(deletedCount).toBe(1)
      expect(mangaRepo.getAllManga().map((m) => m.mangaId)).toEqual(['recent'])
    })

    it('never deletes favourited manga, even when stale', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'fav-old' }))
      mangaRepo.toggleFavourite('fav-old')
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)
      setLastAccessedAt('fav-old', oldDate)

      const deletedCount = mangaRepo.cleanupMangaCache()

      expect(deletedCount).toBe(0)
    })

    it('never deletes manga with a completed download, even when stale', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'downloaded-old' }))
      insertTestChapter('ch-1', 'downloaded-old')
      insertTestDownload('ch-1', 'downloaded-old', DownloadStatus.Completed)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)
      setLastAccessedAt('downloaded-old', oldDate)

      const deletedCount = mangaRepo.cleanupMangaCache()

      expect(deletedCount).toBe(0)
    })

    it('with immediate=true, deletes eligible manga regardless of last-accessed age', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'fresh' }))

      const deletedCount = mangaRepo.cleanupMangaCache(true)

      expect(deletedCount).toBe(1)
      expect(mangaRepo.getAllManga()).toHaveLength(0)
    })
  })

  describe('getLibraryMangaForExport / getAllManga', () => {
    it('getLibraryMangaForExport only returns favourited raw rows', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'fav' }))
      mangaRepo.toggleFavourite('fav')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'not-fav' }))

      const rows = mangaRepo.getLibraryMangaForExport()

      expect(rows.map((r) => r.mangaId)).toEqual(['fav'])
    })

    it('getAllManga returns every row unconditionally', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'fav' }))
      mangaRepo.toggleFavourite('fav')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'not-fav' }))

      expect(
        mangaRepo
          .getAllManga()
          .map((r) => r.mangaId)
          .sort()
      ).toEqual(['fav', 'not-fav'])
    })
  })

  describe('collectionId filter', () => {
    it('returns favourited manga belonging to the given collection', () => {
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm1' }))
      mangaRepo.toggleFavourite('m1')
      mangaRepo.upsertManga(mangaCommand({ mangaId: 'm2' }))
      mangaRepo.toggleFavourite('m2')

      const collectionId = testDb
        .insert(collections)
        .values({ name: 'Reading', createdAt: new Date(), updatedAt: new Date() })
        .returning({ id: collections.id })
        .get().id
      testDb
        .insert(collectionItems)
        .values({ collectionId, mangaId: 'm1', addedAt: new Date() })
        .run()

      const results = mangaRepo.getLibraryManga({ collectionId })

      expect(results.map((r) => r.mangaId)).toEqual(['m1'])
    })
  })
})
