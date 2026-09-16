import { eq } from 'drizzle-orm'
import { chapter, chapterDownloads, manga } from '../schemas'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '@shared/enums/mangadex'
import { CreateDownloadCommand } from '@shared/commands/repositories/chapter-downloads/create-download.command'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { chapterDownloadsRepo } from './chapter-downloads.repo'

function insertTestManga(mangaId: string, coverUrl?: string): void {
  const now = new Date()
  testDb
    .insert(manga)
    .values({
      mangaId,
      title: `Title ${mangaId}`,
      coverUrl,
      addedAt: now,
      updatedAt: now,
      lastAccessedAt: now
    })
    .run()
}

function insertTestChapter(chapterId: string, mangaId: string): void {
  const now = new Date()
  testDb
    .insert(chapter)
    .values({ chapterId, mangaId, language: 'en', publishAt: now, createdAt: now, updatedAt: now })
    .run()
}

function downloadCommand(overrides: Partial<CreateDownloadCommand> = {}): CreateDownloadCommand {
  return {
    chapterId: 'ch-1',
    mangaId: 'manga-1',
    totalPages: 10,
    downloadsBasePath: '/downloads',
    filePath: '/downloads/ch-1.cbz',
    imageQuality: ImageQuality.High,
    ...overrides
  }
}

function seedChapterAndManga(chapterId: string, mangaId: string, coverUrl?: string): void {
  insertTestManga(mangaId, coverUrl)
  insertTestChapter(chapterId, mangaId)
}

describe('ChapterDownloadsRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('createDownload / getDownload', () => {
    it('creates a download queued by default and reads it back joined with manga/chapter', () => {
      seedChapterAndManga('ch-1', 'manga-1')

      chapterDownloadsRepo.createDownload(downloadCommand())

      const result = chapterDownloadsRepo.getDownload('ch-1')
      expect(result).toEqual(
        expect.objectContaining({
          chapterId: 'ch-1',
          mangaId: 'manga-1',
          status: DownloadStatus.Queued,
          title: 'Title manga-1'
        })
      )
    })

    it('returns undefined for a download that does not exist', () => {
      expect(chapterDownloadsRepo.getDownload('missing')).toBeUndefined()
    })
  })

  describe('getAllDownloads', () => {
    it('excludes soft-deleted (hidden) downloads', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      insertTestChapter('ch-2', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-2' }))
      chapterDownloadsRepo.deleteDownload({ chapterId: 'ch-2', isDeletePermanent: false })

      const results = chapterDownloadsRepo.getAllDownloads()

      expect(results.map((r) => r.chapterId)).toEqual(['ch-1'])
    })
  })

  describe('filterDownloadsByMangaId', () => {
    it('returns downloads for the given manga, including hidden ones', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))
      chapterDownloadsRepo.deleteDownload({ chapterId: 'ch-1', isDeletePermanent: false })

      const results = chapterDownloadsRepo.filterDownloadsByMangaId('manga-1')

      expect(results.map((r) => r.chapterId)).toEqual(['ch-1'])
    })
  })

  describe('deleteDownload', () => {
    it('permanently removes the row when isDeletePermanent is true', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))

      chapterDownloadsRepo.deleteDownload({ chapterId: 'ch-1', isDeletePermanent: true })

      expect(chapterDownloadsRepo.getDownload('ch-1')).toBeUndefined()
      expect(chapterDownloadsRepo.filterDownloadsByMangaId('manga-1')).toEqual([])
    })

    it('only marks the row hidden, keeping it in the database, when isDeletePermanent is false', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))

      chapterDownloadsRepo.deleteDownload({ chapterId: 'ch-1', isDeletePermanent: false })

      expect(chapterDownloadsRepo.filterDownloadsByMangaId('manga-1')).toHaveLength(1)
      expect(chapterDownloadsRepo.getAllDownloads()).toEqual([])
    })
  })

  describe('batchDeleteDownloads', () => {
    it('applies a mix of permanent and soft deletes in one call', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      insertTestChapter('ch-2', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-2' }))

      chapterDownloadsRepo.batchDeleteDownloads([
        { chapterId: 'ch-1', isDeletePermanent: true },
        { chapterId: 'ch-2', isDeletePermanent: false }
      ])

      expect(chapterDownloadsRepo.getDownload('ch-1')).toBeUndefined()
      expect(
        chapterDownloadsRepo.filterDownloadsByMangaId('manga-1').map((r) => r.chapterId)
      ).toEqual(['ch-2'])
      expect(chapterDownloadsRepo.getAllDownloads()).toEqual([])
    })
  })

  describe('markDownloadState', () => {
    it('marks a download completed with storage size, page count, and downloadedAt', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))

      chapterDownloadsRepo.markDownloadState({
        chapterId: 'ch-1',
        isDownloaded: true,
        storageSize: 1024,
        totalPages: 12,
        imageFormat: '.png'
      })

      const result = chapterDownloadsRepo.getDownload('ch-1')
      expect(result).toEqual(
        expect.objectContaining({
          status: DownloadStatus.Completed,
          storageSize: 1024,
          totalPages: 12,
          imageFormat: '.png'
        })
      )
    })

    it('marks a download failed with an error message', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))

      chapterDownloadsRepo.markDownloadState({
        chapterId: 'ch-1',
        isFailed: true,
        storageSize: 0,
        totalPages: 0,
        errorMessage: 'Network error'
      })

      const result = chapterDownloadsRepo.getDownload('ch-1')
      expect(result).toEqual(
        expect.objectContaining({ status: DownloadStatus.Failed, errorMessage: 'Network error' })
      )
    })
  })

  describe('batchMarkDownloadsState', () => {
    it('applies state updates to every download in the batch', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      insertTestChapter('ch-2', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-2' }))

      chapterDownloadsRepo.batchMarkDownloadsState([
        { chapterId: 'ch-1', isDownloaded: true, storageSize: 100, totalPages: 5 },
        { chapterId: 'ch-2', isFailed: true, storageSize: 0, totalPages: 0, errorMessage: 'oops' }
      ])

      expect(chapterDownloadsRepo.getDownload('ch-1')?.status).toBe(DownloadStatus.Completed)
      expect(chapterDownloadsRepo.getDownload('ch-2')?.status).toBe(DownloadStatus.Failed)
    })
  })

  describe('updateVerificationTimestamp', () => {
    it('bumps lastVerifiedAt for the given download', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))
      const before = testDb
        .select({ lastVerifiedAt: chapterDownloads.lastVerifiedAt })
        .from(chapterDownloads)
        .where(eq(chapterDownloads.chapterId, 'ch-1'))
        .get()?.lastVerifiedAt

      vi.useFakeTimers()
      vi.setSystemTime(new Date((before?.getTime() ?? 0) + 60_000))
      chapterDownloadsRepo.updateVerificationTimestamp('ch-1')
      vi.useRealTimers()

      const after = testDb
        .select({ lastVerifiedAt: chapterDownloads.lastVerifiedAt })
        .from(chapterDownloads)
        .where(eq(chapterDownloads.chapterId, 'ch-1'))
        .get()?.lastVerifiedAt

      expect(after?.getTime()).toBeGreaterThan(before?.getTime() ?? 0)
    })
  })

  describe('countDownloadsByStatus', () => {
    it('counts only downloads matching the given status', () => {
      seedChapterAndManga('ch-1', 'manga-1')
      insertTestChapter('ch-2', 'manga-1')
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-1' }))
      chapterDownloadsRepo.createDownload(downloadCommand({ chapterId: 'ch-2' }))
      chapterDownloadsRepo.markDownloadState({
        chapterId: 'ch-1',
        isDownloaded: true,
        storageSize: 100,
        totalPages: 5
      })

      expect(chapterDownloadsRepo.countDownloadsByStatus(DownloadStatus.Completed)).toBe(1)
      expect(chapterDownloadsRepo.countDownloadsByStatus(DownloadStatus.Queued)).toBe(1)
    })
  })

  describe('getStorageByManga', () => {
    it('sums completed, non-hidden storage per manga and across the whole app', () => {
      seedChapterAndManga('ch-1', 'manga-1', 'https://example.com/cover1.jpg')
      insertTestChapter('ch-2', 'manga-1')
      seedChapterAndManga('ch-3', 'manga-2', 'https://example.com/cover2.jpg')

      chapterDownloadsRepo.createDownload(
        downloadCommand({ chapterId: 'ch-1', mangaId: 'manga-1' })
      )
      chapterDownloadsRepo.createDownload(
        downloadCommand({ chapterId: 'ch-2', mangaId: 'manga-1' })
      )
      chapterDownloadsRepo.createDownload(
        downloadCommand({ chapterId: 'ch-3', mangaId: 'manga-2' })
      )
      chapterDownloadsRepo.markDownloadState({
        chapterId: 'ch-1',
        isDownloaded: true,
        storageSize: 1000,
        totalPages: 5
      })
      chapterDownloadsRepo.markDownloadState({
        chapterId: 'ch-2',
        isDownloaded: true,
        storageSize: 500,
        totalPages: 5
      })
      chapterDownloadsRepo.markDownloadState({
        chapterId: 'ch-3',
        isDownloaded: true,
        storageSize: 2000,
        totalPages: 5
      })
      // Hidden downloads must not count towards storage totals
      chapterDownloadsRepo.deleteDownload({ chapterId: 'ch-3', isDeletePermanent: false })

      const result = chapterDownloadsRepo.getStorageByManga()

      expect(result.totalAppStorage).toBe(1500)
      expect(result.mangaStorageByTitle).toEqual([
        expect.objectContaining({ mangaId: 'manga-1', totalStorageSize: 1500, chapterCount: 2 })
      ])
    })
  })
})
