import { manga } from '../schemas'
import { ReadingMode } from '@shared/enums/settings/reading-mode.enum'
import { UpdateMangaOverrideCommand } from '@shared/commands/repositories/manga/update-manga-override.command'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { readerSettingsRepo } from './reader-settings.repo'

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

function overrideCommand(
  overrides: Partial<UpdateMangaOverrideCommand> = {}
): UpdateMangaOverrideCommand {
  return {
    mangaId: 'manga-1',
    overrideData: { readingMode: ReadingMode.SinglePage },
    ...overrides
  }
}

describe('ReaderSettingsRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
    insertTestManga('manga-1')
  })

  describe('updateMangaOverride / getMangaOverride', () => {
    it('creates a new override', () => {
      readerSettingsRepo.updateMangaOverride(overrideCommand())

      expect(readerSettingsRepo.getMangaOverride('manga-1')).toEqual({
        readingMode: ReadingMode.SinglePage
      })
    })

    it('replaces the settings on conflict rather than creating a duplicate row', () => {
      readerSettingsRepo.updateMangaOverride(overrideCommand())

      readerSettingsRepo.updateMangaOverride(
        overrideCommand({ overrideData: { readingMode: ReadingMode.VerticalScroll } })
      )

      expect(readerSettingsRepo.getMangaOverride('manga-1')).toEqual({
        readingMode: ReadingMode.VerticalScroll
      })
      expect(readerSettingsRepo.getAllOverridesWithMetadata()).toHaveLength(1)
    })

    it('returns undefined when there is no override for the manga', () => {
      expect(readerSettingsRepo.getMangaOverride('missing')).toBeUndefined()
    })
  })

  describe('batchUpdateOverrides', () => {
    it('applies overrides for every manga in the batch', () => {
      insertTestManga('manga-2')

      readerSettingsRepo.batchUpdateOverrides([
        overrideCommand({ mangaId: 'manga-1' }),
        overrideCommand({
          mangaId: 'manga-2',
          overrideData: { readingMode: ReadingMode.DoublePage }
        })
      ])

      expect(readerSettingsRepo.getMangaOverride('manga-1')?.readingMode).toBe(
        ReadingMode.SinglePage
      )
      expect(readerSettingsRepo.getMangaOverride('manga-2')?.readingMode).toBe(
        ReadingMode.DoublePage
      )
    })
  })

  describe('clearMangaOverride', () => {
    it('removes the override for one manga only', () => {
      insertTestManga('manga-2')
      readerSettingsRepo.batchUpdateOverrides([
        overrideCommand({ mangaId: 'manga-1' }),
        overrideCommand({ mangaId: 'manga-2' })
      ])

      readerSettingsRepo.clearMangaOverride('manga-1')

      expect(readerSettingsRepo.getMangaOverride('manga-1')).toBeUndefined()
      expect(readerSettingsRepo.getMangaOverride('manga-2')).toBeDefined()
    })
  })

  describe('clearAllOverrides', () => {
    it('removes every override', () => {
      insertTestManga('manga-2')
      readerSettingsRepo.batchUpdateOverrides([
        overrideCommand({ mangaId: 'manga-1' }),
        overrideCommand({ mangaId: 'manga-2' })
      ])

      readerSettingsRepo.clearAllOverrides()

      expect(readerSettingsRepo.getAllOverridesWithMetadata()).toEqual([])
    })
  })

  describe('getAllOverridesWithMetadata', () => {
    it('joins manga title and cover url onto each override', () => {
      readerSettingsRepo.updateMangaOverride(overrideCommand())

      const [result] = readerSettingsRepo.getAllOverridesWithMetadata()

      expect(result).toEqual(
        expect.objectContaining({
          mangaId: 'manga-1',
          title: 'Title manga-1',
          readerSettings: { readingMode: ReadingMode.SinglePage }
        })
      )
    })
  })
})
