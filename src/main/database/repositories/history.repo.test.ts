import { chapter, manga, mangaProgress, readHistory } from '../schemas'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { historyRepo } from './history.repo'

// logReadEvent/deleteHistoryForManga require real UUIDs
const MANGA_1 = '11111111-1111-1111-1111-111111111111'
const MANGA_2 = '22222222-2222-2222-2222-222222222222'
const CHAPTER_1 = '33333333-3333-3333-3333-333333333333'
const CHAPTER_2 = '44444444-4444-4444-4444-444444444444'

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

function insertTestChapter(chapterId: string, mangaId: string): void {
  const now = new Date()
  testDb
    .insert(chapter)
    .values({ chapterId, mangaId, language: 'en', publishAt: now, createdAt: now, updatedAt: now })
    .run()
}

// Bypasses logReadEvent's validation to seed rows with specific dates/timestamps
function insertReadHistoryRow(
  mangaId: string,
  chapterId: string,
  readDate: string,
  readAt: Date
): void {
  testDb.insert(readHistory).values({ mangaId, chapterId, readDate, readAt }).run()
}

function insertMangaProgress(mangaId: string, lastChapterId: string, lastReadAt: Date): void {
  testDb
    .insert(mangaProgress)
    .values({ mangaId, lastChapterId, firstReadAt: lastReadAt, lastReadAt })
    .run()
}

describe('HistoryRepo', () => {
  beforeEach(() => {
    testDb = createTestDb()
    insertTestManga(MANGA_1)
    insertTestManga(MANGA_2)
    insertTestChapter(CHAPTER_1, MANGA_1)
    insertTestChapter(CHAPTER_2, MANGA_2)
  })

  describe('logReadEvent', () => {
    it('throws for an invalid date format', () => {
      expect(() => historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '01-01-2026')).toThrow(TypeError)
    })

    it('throws for a non-UUID manga or chapter id', () => {
      expect(() => historyRepo.logReadEvent('manga-1', CHAPTER_1, '2026-01-01')).toThrow(TypeError)
      expect(() => historyRepo.logReadEvent(MANGA_1, 'ch-1', '2026-01-01')).toThrow(TypeError)
    })

    it('inserts a new event and returns true', () => {
      const result = historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '2026-01-01')

      expect(result).toBe(true)
      expect(historyRepo.getEventsByDate('2026-01-01')).toEqual([
        expect.objectContaining({ mangaId: MANGA_1, chapterId: CHAPTER_1, readDate: '2026-01-01' })
      ])
    })

    it('updates the existing row in place rather than duplicating on repeated logging', () => {
      historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '2026-01-01')

      const again = historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '2026-01-01')

      expect(again).toBe(true)
      expect(historyRepo.getEventsByDate('2026-01-01')).toHaveLength(1)
    })
  })

  describe('deleteHistoryForManga', () => {
    it('throws for a non-UUID manga id', () => {
      expect(() => historyRepo.deleteHistoryForManga('manga-1')).toThrow(TypeError)
    })

    it('removes every event for the given manga and returns true', () => {
      historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '2026-01-01')

      const result = historyRepo.deleteHistoryForManga(MANGA_1)

      expect(result).toBe(true)
      expect(historyRepo.getEventsByDate('2026-01-01')).toEqual([])
    })

    it('returns false when the manga has no history', () => {
      expect(historyRepo.deleteHistoryForManga(MANGA_1)).toBe(false)
    })
  })

  describe('getActiveDates', () => {
    it('throws for an invalid date format', () => {
      expect(() => historyRepo.getActiveDates({ fromDate: 'bad', toDate: '2026-01-31' })).toThrow(
        TypeError
      )
    })

    it('returns distinct dates with reading activity inside the given range', () => {
      insertReadHistoryRow(MANGA_1, CHAPTER_1, '2026-01-05', new Date('2026-01-05T00:00:00Z'))
      // Different manga on the same date - should still collapse to one distinct entry
      insertReadHistoryRow(MANGA_2, CHAPTER_2, '2026-01-05', new Date('2026-01-05T01:00:00Z'))
      insertReadHistoryRow(MANGA_1, CHAPTER_1, '2026-01-10', new Date('2026-01-10T00:00:00Z'))
      // Outside the requested range
      insertReadHistoryRow(MANGA_2, CHAPTER_2, '2026-02-01', new Date('2026-02-01T00:00:00Z'))

      const dates = historyRepo.getActiveDates({ fromDate: '2026-01-01', toDate: '2026-01-31' })

      expect(dates.sort()).toEqual(['2026-01-05', '2026-01-10'])
    })
  })

  describe('getEventsByDate', () => {
    it('throws for an invalid date format', () => {
      expect(() => historyRepo.getEventsByDate('bad')).toThrow(TypeError)
    })

    it('joins manga and chapter metadata for events on the given date', () => {
      historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '2026-01-01')

      const [result] = historyRepo.getEventsByDate('2026-01-01')

      expect(result).toEqual(
        expect.objectContaining({
          mangaId: MANGA_1,
          chapterId: CHAPTER_1,
          title: `Title ${MANGA_1}`,
          readDate: '2026-01-01'
        })
      )
    })

    it('returns an empty array when nothing happened on that date', () => {
      expect(historyRepo.getEventsByDate('2026-01-01')).toEqual([])
    })
  })

  describe('getRecentEvents', () => {
    it('throws for a non-positive or non-integer limit', () => {
      expect(() => historyRepo.getRecentEvents(0)).toThrow(TypeError)
      expect(() => historyRepo.getRecentEvents(-1)).toThrow(TypeError)
      expect(() => historyRepo.getRecentEvents(1.5)).toThrow(TypeError)
    })

    it('returns the most recent events first, limited to the requested count', () => {
      insertReadHistoryRow(MANGA_1, CHAPTER_1, '2026-01-01', new Date('2026-01-01T00:00:00Z'))
      insertReadHistoryRow(MANGA_1, CHAPTER_1, '2026-01-02', new Date('2026-01-02T00:00:00Z'))
      insertReadHistoryRow(MANGA_2, CHAPTER_2, '2026-01-03', new Date('2026-01-03T00:00:00Z'))

      const results = historyRepo.getRecentEvents(2)

      expect(results.map((r) => r.readDate)).toEqual(['2026-01-03', '2026-01-02'])
    })
  })

  describe('migrateHistoryFromMangaProgress', () => {
    it('returns false when readHistory already has records', () => {
      historyRepo.logReadEvent(MANGA_1, CHAPTER_1, '2026-01-01')

      expect(historyRepo.migrateHistoryFromMangaProgress()).toBe(false)
    })

    it('returns false when there is no progress to migrate', () => {
      expect(historyRepo.migrateHistoryFromMangaProgress()).toBe(false)
    })

    it('migrates each manga-progress row into read history', () => {
      insertMangaProgress(MANGA_1, CHAPTER_1, new Date('2026-01-01T00:00:00Z'))

      const migrated = historyRepo.migrateHistoryFromMangaProgress()

      expect(migrated).toBe(true)
      expect(historyRepo.getEventsByDate('2026-01-01')).toEqual([
        expect.objectContaining({ mangaId: MANGA_1, chapterId: CHAPTER_1, readDate: '2026-01-01' })
      ])
    })
  })
})
