import { chapterProgress, mangaProgress } from '../schemas'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { readingRepo } from './reading-stats.repo'

function insertMangaProgress(mangaId: string, lastChapterId: string): void {
  const now = new Date()
  testDb
    .insert(mangaProgress)
    .values({ mangaId, lastChapterId, firstReadAt: now, lastReadAt: now })
    .run()
}

function insertChapterProgress(mangaId: string, chapterId: string, currentPage: number): void {
  testDb
    .insert(chapterProgress)
    .values({ mangaId, chapterId, currentPage, lastReadAt: new Date() })
    .run()
}

describe('ReadingStatisticRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('getStats', () => {
    it('returns all zeros when statistics have never been calculated', () => {
      expect(readingRepo.getStats()).toEqual({
        totalMangaRead: 0,
        totalChaptersRead: 0,
        totalPagesRead: 0,
        totalEstimatedMinutesRead: 0
      })
    })
  })

  describe('calculateStatistics', () => {
    it('produces all zeros when there is no chapter progress', () => {
      readingRepo.calculateStatistics()

      expect(readingRepo.getStats()).toEqual({
        totalMangaRead: 0,
        totalChaptersRead: 0,
        totalPagesRead: 0,
        totalEstimatedMinutesRead: 0
      })
    })

    it('counts distinct manga/chapters and sums pages (0-indexed, so +1 per row)', () => {
      insertMangaProgress('manga-1', 'ch-2')
      insertChapterProgress('manga-1', 'ch-1', 9) // 10 pages read
      insertChapterProgress('manga-1', 'ch-2', 4) // 5 pages read

      readingRepo.calculateStatistics()

      expect(readingRepo.getStats()).toEqual(
        expect.objectContaining({ totalMangaRead: 1, totalChaptersRead: 2, totalPagesRead: 15 })
      )
    })

    it('estimates minutes at 20 seconds per page', () => {
      insertMangaProgress('manga-1', 'ch-1')
      insertChapterProgress('manga-1', 'ch-1', 179) // 180 pages -> 3600s -> 60 minutes

      readingRepo.calculateStatistics()

      expect(readingRepo.getStats().totalEstimatedMinutesRead).toBe(60)
    })

    it('counts manga once even with multiple chapters read', () => {
      insertMangaProgress('manga-1', 'ch-2')
      insertChapterProgress('manga-1', 'ch-1', 0)
      insertChapterProgress('manga-1', 'ch-2', 0)

      readingRepo.calculateStatistics()

      expect(readingRepo.getStats().totalMangaRead).toBe(1)
    })

    it('recalculates in place on repeated calls rather than erroring', () => {
      insertMangaProgress('manga-1', 'ch-1')
      insertChapterProgress('manga-1', 'ch-1', 0)
      readingRepo.calculateStatistics()

      insertMangaProgress('manga-2', 'ch-2')
      insertChapterProgress('manga-2', 'ch-2', 0)
      readingRepo.calculateStatistics()

      expect(readingRepo.getStats().totalMangaRead).toBe(2)
    })
  })
})
