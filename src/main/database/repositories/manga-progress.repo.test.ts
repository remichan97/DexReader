import { chapter, manga } from '../schemas'
import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { progressRepo } from './manga-progress.repo'
import { readingRepo } from './reading-stats.repo'

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
    mangaId: 'manga-1',
    chapterId: 'ch-1',
    currentPage: 3,
    completed: false,
    ...overrides
  }
}

describe('MangaProgressRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('saveProgress', () => {
    it('creates both the manga-level and chapter-level progress rows', () => {
      progressRepo.saveProgress([progressCommand()])

      expect(progressRepo.getProgressByMangaId('manga-1')).toEqual(
        expect.objectContaining({ mangaId: 'manga-1', lastChapterId: 'ch-1', currentPage: 3 })
      )
      expect(progressRepo.getChapterProgress('manga-1', 'ch-1')).toEqual(
        expect.objectContaining({ currentPage: 3, completed: false })
      )
    })

    it('updates the manga-level pointer and chapter-level progress on repeated saves', () => {
      progressRepo.saveProgress([progressCommand({ chapterId: 'ch-1', currentPage: 1 })])

      progressRepo.saveProgress([
        progressCommand({ chapterId: 'ch-2', currentPage: 5, completed: true })
      ])

      expect(progressRepo.getProgressByMangaId('manga-1')).toEqual(
        expect.objectContaining({ lastChapterId: 'ch-2', currentPage: 5, completed: true })
      )
      // Progress for the earlier chapter is retained, not overwritten
      expect(progressRepo.getChapterProgress('manga-1', 'ch-1')).toEqual(
        expect.objectContaining({ currentPage: 1 })
      )
    })

    it('re-saving the same chapter updates its progress in place rather than duplicating it', () => {
      progressRepo.saveProgress([progressCommand({ chapterId: 'ch-1', currentPage: 1 })])

      progressRepo.saveProgress([progressCommand({ chapterId: 'ch-1', currentPage: 8 })])

      expect(progressRepo.getAllChapterProgress('manga-1')).toHaveLength(1)
      expect(progressRepo.getChapterProgress('manga-1', 'ch-1')?.currentPage).toBe(8)
    })

    it('updates reading statistics as a side effect', () => {
      progressRepo.saveProgress([
        progressCommand({ mangaId: 'manga-1', chapterId: 'ch-1', currentPage: 4 })
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

      progressRepo.deleteProgress('manga-1')

      expect(progressRepo.getProgressByMangaId('manga-1')).toBeUndefined()
      expect(progressRepo.getAllChapterProgress('manga-1')).toEqual([])
    })
  })

  describe('getAllProgressWithMetadata', () => {
    it('joins manga and chapter details onto each progress entry', () => {
      insertTestManga('manga-1')
      insertTestChapter('ch-1', 'manga-1')
      progressRepo.saveProgress([progressCommand({ mangaId: 'manga-1', chapterId: 'ch-1' })])

      const [result] = progressRepo.getAllProgressWithMetadata()

      expect(result).toEqual(
        expect.objectContaining({
          mangaId: 'manga-1',
          title: 'Title manga-1',
          lastChapterId: 'ch-1'
        })
      )
    })
  })

  describe('updateFirstReadAt', () => {
    it('updates only firstReadAt, leaving the rest of the progress row untouched', () => {
      progressRepo.saveProgress([progressCommand({ chapterId: 'ch-1', currentPage: 3 })])
      const newFirstReadAt = Math.floor(new Date('2020-01-01T00:00:00Z').getTime() / 1000)

      progressRepo.updateFirstReadAt([{ mangaId: 'manga-1', firstReadAt: newFirstReadAt }])

      const result = progressRepo.getProgressByMangaId('manga-1')
      expect(result?.firstReadAt).toBe(newFirstReadAt)
      expect(result?.lastChapterId).toBe('ch-1')
    })
  })

  describe('getChapterProgress', () => {
    it('returns undefined for a chapter with no recorded progress', () => {
      expect(progressRepo.getChapterProgress('manga-1', 'missing')).toBeUndefined()
    })
  })

  describe('getAllChapterProgress / getAllChapterProgressForAllManga', () => {
    it('scopes getAllChapterProgress to the given manga only', () => {
      progressRepo.saveProgress([
        progressCommand({ mangaId: 'manga-1', chapterId: 'ch-1' }),
        progressCommand({ mangaId: 'manga-2', chapterId: 'ch-2' })
      ])

      expect(progressRepo.getAllChapterProgress('manga-1').map((p) => p.chapterId)).toEqual([
        'ch-1'
      ])
      expect(
        progressRepo
          .getAllChapterProgressForAllManga()
          .map((p) => p.chapterId)
          .sort()
      ).toEqual(['ch-1', 'ch-2'])
    })

    it('returns an empty array when there is no progress at all', () => {
      expect(progressRepo.getAllChapterProgress('manga-1')).toEqual([])
      expect(progressRepo.getAllChapterProgressForAllManga()).toEqual([])
    })
  })

  describe('getAllMangaProgress', () => {
    it('returns progress for every manga', () => {
      progressRepo.saveProgress([
        progressCommand({ mangaId: 'manga-1', chapterId: 'ch-1' }),
        progressCommand({ mangaId: 'manga-2', chapterId: 'ch-2' })
      ])

      expect(
        progressRepo
          .getAllMangaProgress()
          .map((p) => p.mangaId)
          .sort()
      ).toEqual(['manga-1', 'manga-2'])
    })

    it('returns an empty array when there is no progress at all', () => {
      expect(progressRepo.getAllMangaProgress()).toEqual([])
    })
  })
})
