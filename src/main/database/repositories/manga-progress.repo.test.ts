import { chapter, manga } from '../schemas'
import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { progressRepo } from './manga-progress.repo'
import { readingRepo } from './reading-stats.repo'

// logReadEvent (invoked by saveProgress) requires real UUIDs, unlike the other repo test suites
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

function progressCommand(overrides: Partial<SaveProgressCommand> = {}): SaveProgressCommand {
  return {
    mangaId: MANGA_1,
    chapterId: CHAPTER_1,
    currentPage: 3,
    completed: false,
    ...overrides
  }
}

describe('MangaProgressRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
    // readHistory.mangaId has a FK to manga.mangaId, so saveProgress (which logs a read
    // event) requires the manga row to already exist
    insertTestManga(MANGA_1)
    insertTestManga(MANGA_2)
  })

  describe('saveProgress', () => {
    it('creates both the manga-level and chapter-level progress rows', () => {
      progressRepo.saveProgress([progressCommand()])

      expect(progressRepo.getProgressByMangaId(MANGA_1)).toEqual(
        expect.objectContaining({ mangaId: MANGA_1, lastChapterId: CHAPTER_1, currentPage: 3 })
      )
      expect(progressRepo.getChapterProgress(MANGA_1, CHAPTER_1)).toEqual(
        expect.objectContaining({ currentPage: 3, completed: false })
      )
    })

    it('updates the manga-level pointer and chapter-level progress on repeated saves', () => {
      progressRepo.saveProgress([progressCommand({ chapterId: CHAPTER_1, currentPage: 1 })])

      progressRepo.saveProgress([
        progressCommand({ chapterId: CHAPTER_2, currentPage: 5, completed: true })
      ])

      expect(progressRepo.getProgressByMangaId(MANGA_1)).toEqual(
        expect.objectContaining({ lastChapterId: CHAPTER_2, currentPage: 5, completed: true })
      )
      // Progress for the earlier chapter is retained, not overwritten
      expect(progressRepo.getChapterProgress(MANGA_1, CHAPTER_1)).toEqual(
        expect.objectContaining({ currentPage: 1 })
      )
    })

    it('re-saving the same chapter updates its progress in place rather than duplicating it', () => {
      progressRepo.saveProgress([progressCommand({ chapterId: CHAPTER_1, currentPage: 1 })])

      progressRepo.saveProgress([progressCommand({ chapterId: CHAPTER_1, currentPage: 8 })])

      expect(progressRepo.getAllChapterProgress(MANGA_1)).toHaveLength(1)
      expect(progressRepo.getChapterProgress(MANGA_1, CHAPTER_1)?.currentPage).toBe(8)
    })

    it('updates reading statistics as a side effect', () => {
      progressRepo.saveProgress([
        progressCommand({ mangaId: MANGA_1, chapterId: CHAPTER_1, currentPage: 4 })
      ])

      // currentPage is 0-indexed, so page 4 counts as 5 pages read
      expect(readingRepo.getStats()).toEqual(
        expect.objectContaining({ totalMangaRead: 1, totalChaptersRead: 1, totalPagesRead: 5 })
      )
    })
  })

  describe('getProgressByMangaId', () => {
    it('returns undefined when there is no progress for the manga', () => {
      expect(progressRepo.getProgressByMangaId('missing')).toBeUndefined()
    })
  })

  describe('deleteProgress', () => {
    it('removes the manga progress row and cascades to its chapter progress rows', () => {
      progressRepo.saveProgress([progressCommand()])

      progressRepo.deleteProgress(MANGA_1)

      expect(progressRepo.getProgressByMangaId(MANGA_1)).toBeUndefined()
      expect(progressRepo.getAllChapterProgress(MANGA_1)).toEqual([])
    })
  })

  describe('getAllProgressWithMetadata', () => {
    it('joins manga and chapter details onto each progress entry', () => {
      insertTestChapter(CHAPTER_1, MANGA_1)
      progressRepo.saveProgress([progressCommand({ mangaId: MANGA_1, chapterId: CHAPTER_1 })])

      const [result] = progressRepo.getAllProgressWithMetadata()

      expect(result).toEqual(
        expect.objectContaining({
          mangaId: MANGA_1,
          title: `Title ${MANGA_1}`,
          lastChapterId: CHAPTER_1
        })
      )
    })
  })

  describe('updateFirstReadAt', () => {
    it('updates only firstReadAt, leaving the rest of the progress row untouched', () => {
      progressRepo.saveProgress([progressCommand({ chapterId: CHAPTER_1, currentPage: 3 })])
      const newFirstReadAt = Math.floor(new Date('2020-01-01T00:00:00Z').getTime() / 1000)

      progressRepo.updateFirstReadAt([{ mangaId: MANGA_1, firstReadAt: newFirstReadAt }])

      const result = progressRepo.getProgressByMangaId(MANGA_1)
      expect(result?.firstReadAt).toBe(newFirstReadAt)
      expect(result?.lastChapterId).toBe(CHAPTER_1)
    })
  })

  describe('getChapterProgress', () => {
    it('returns undefined for a chapter with no recorded progress', () => {
      expect(progressRepo.getChapterProgress(MANGA_1, 'missing')).toBeUndefined()
    })
  })

  describe('getAllChapterProgress / getAllChapterProgressForAllManga', () => {
    it('scopes getAllChapterProgress to the given manga only', () => {
      progressRepo.saveProgress([
        progressCommand({ mangaId: MANGA_1, chapterId: CHAPTER_1 }),
        progressCommand({ mangaId: MANGA_2, chapterId: CHAPTER_2 })
      ])

      expect(progressRepo.getAllChapterProgress(MANGA_1).map((p) => p.chapterId)).toEqual([
        CHAPTER_1
      ])
      expect(
        progressRepo
          .getAllChapterProgressForAllManga()
          .map((p) => p.chapterId)
          .sort()
      ).toEqual([CHAPTER_1, CHAPTER_2].sort())
    })

    it('returns an empty array when there is no progress at all', () => {
      expect(progressRepo.getAllChapterProgress(MANGA_1)).toEqual([])
      expect(progressRepo.getAllChapterProgressForAllManga()).toEqual([])
    })
  })

  describe('getAllMangaProgress', () => {
    it('returns progress for every manga', () => {
      progressRepo.saveProgress([
        progressCommand({ mangaId: MANGA_1, chapterId: CHAPTER_1 }),
        progressCommand({ mangaId: MANGA_2, chapterId: CHAPTER_2 })
      ])

      expect(
        progressRepo
          .getAllMangaProgress()
          .map((p) => p.mangaId)
          .sort()
      ).toEqual([MANGA_1, MANGA_2].sort())
    })

    it('returns an empty array when there is no progress at all', () => {
      expect(progressRepo.getAllMangaProgress()).toEqual([])
    })
  })
})
