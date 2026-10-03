import { manga } from '../schemas'
import { SaveChapterCommand } from '@shared/commands/repositories/progress/save-chapter.command'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { chapterRepo } from './chapter.repo'

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

function chapterCommand(overrides: Partial<SaveChapterCommand> = {}): SaveChapterCommand {
  return {
    chapterId: 'ch-1',
    mangaId: 'manga-1',
    language: 'en',
    publishAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  }
}

describe('ChapterRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
    insertTestManga('manga-1')
  })

  describe('saveChapters', () => {
    it('inserts new chapters', () => {
      chapterRepo.saveChapters([chapterCommand({ chapterId: 'ch-1', title: 'Chapter One' })])

      expect(chapterRepo.getChapterById('ch-1')).toEqual(
        expect.objectContaining({ chapterId: 'ch-1', title: 'Chapter One' })
      )
    })

    it('updates title/chapterNumber/volume on conflict, leaving other fields untouched', () => {
      chapterRepo.saveChapters([
        chapterCommand({
          chapterId: 'ch-1',
          title: 'Original',
          scanlationGroup: 'Group A',
          externalUrl: 'https://example.com/original'
        })
      ])

      chapterRepo.saveChapters([
        chapterCommand({ chapterId: 'ch-1', title: 'Updated', chapterNumber: '2', volume: '1' })
      ])

      const result = chapterRepo.getChapterById('ch-1')
      expect(result).toEqual(
        expect.objectContaining({
          title: 'Updated',
          chapterNumber: '2',
          volume: '1',
          scanlatorGroup: 'Group A',
          externalUrl: 'https://example.com/original'
        })
      )
    })

    it('saves multiple chapters in a single transaction', () => {
      chapterRepo.saveChapters([
        chapterCommand({ chapterId: 'ch-1' }),
        chapterCommand({ chapterId: 'ch-2' })
      ])

      expect(
        chapterRepo
          .getChaptersByMangaId('manga-1')
          .map((c) => c.chapterId)
          .sort()
      ).toEqual(['ch-1', 'ch-2'])
    })
  })

  describe('getChapterById', () => {
    it('returns undefined for a chapter that does not exist', () => {
      expect(chapterRepo.getChapterById('missing')).toBeUndefined()
    })
  })

  describe('getChaptersByMangaId', () => {
    it('only returns chapters for the given manga', () => {
      insertTestManga('manga-2')
      chapterRepo.saveChapters([
        chapterCommand({ chapterId: 'ch-1', mangaId: 'manga-1' }),
        chapterCommand({ chapterId: 'ch-2', mangaId: 'manga-2' })
      ])

      const results = chapterRepo.getChaptersByMangaId('manga-1')

      expect(results.map((c) => c.chapterId)).toEqual(['ch-1'])
    })
  })

  describe('getChaptersByMangaIds', () => {
    it('returns an empty array without querying when given no ids', () => {
      expect(chapterRepo.getChaptersByMangaIds([])).toEqual([])
    })

    it('returns chapters across multiple manga', () => {
      insertTestManga('manga-2')
      chapterRepo.saveChapters([
        chapterCommand({ chapterId: 'ch-1', mangaId: 'manga-1' }),
        chapterCommand({ chapterId: 'ch-2', mangaId: 'manga-2' })
      ])

      const results = chapterRepo.getChaptersByMangaIds(['manga-1', 'manga-2'])

      expect(results.map((c) => c.chapterId).sort()).toEqual(['ch-1', 'ch-2'])
    })
  })
})
