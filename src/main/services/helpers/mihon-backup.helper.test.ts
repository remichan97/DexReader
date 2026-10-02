vi.mock('../../database/repositories/collection.repo', () => ({
  collectionRepo: { getAllCollections: vi.fn(), createCollection: vi.fn() }
}))

import { mihonBackup } from './mihon-backup.helper'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { PublicationStatus } from '../../api/enums'
import { BackupManga } from '../types/mihon/backup-manga.type'
import { BackupChapter } from '../types/mihon/backup-chapter.type'
import { BackupHistory } from '../types/mihon/backup-history.type'
import { BackupCategory } from '../types/mihon/backup-category.type'

const MANGA_ID = '019353d8-5fbf-7c7c-8a3d-123456789abc'
const CHAPTER_ID = '019353d8-5fbf-7c7c-8a3d-abcdef012345'

function backupManga(overrides: Partial<BackupManga> = {}): BackupManga {
  return {
    source: '2499283573021220255',
    url: `/manga/${MANGA_ID}`,
    title: 'Berserk',
    history: [],
    chapters: [],
    categories: [],
    ...overrides
  }
}

function backupChapter(overrides: Partial<BackupChapter> = {}): BackupChapter {
  return { url: `/chapter/${CHAPTER_ID}`, ...overrides }
}

function backupHistory(overrides: Partial<BackupHistory> = {}): BackupHistory {
  return { url: `/chapter/${CHAPTER_ID}`, lastRead: 1700000000, ...overrides }
}

function backupCategory(overrides: Partial<BackupCategory> = {}): BackupCategory {
  return { name: 'Favourites', ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('mapCategoriesToCollections', () => {
  it('returns an empty map and makes no repo calls when there are no categories', () => {
    expect(mihonBackup.mapCategoriesToCollections([])).toEqual(new Map())
    expect(collectionRepo.getAllCollections).not.toHaveBeenCalled()
  })

  it('maps a category to an existing collection of the same name without creating one', () => {
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([
      { id: 42, name: 'Favourites' } as never
    ])

    const result = mihonBackup.mapCategoriesToCollections([
      backupCategory({ id: 1, name: 'Favourites' })
    ])

    expect(result.get(1)).toBe(42)
    expect(collectionRepo.createCollection).not.toHaveBeenCalled()
  })

  it('creates a new collection when no existing one matches the category name', () => {
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([])
    vi.mocked(collectionRepo.createCollection).mockReturnValue(99)

    const result = mihonBackup.mapCategoriesToCollections([
      backupCategory({ id: 1, name: 'Plan to Read' })
    ])

    expect(collectionRepo.createCollection).toHaveBeenCalledWith({
      name: 'Plan to Read',
      description: 'Import from Tachiyomi/Mihon backup'
    })
    expect(result.get(1)).toBe(99)
  })

  it('falls back to a descending negative key when the category has no id', () => {
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([])
    vi.mocked(collectionRepo.createCollection).mockReturnValueOnce(1).mockReturnValueOnce(2)

    const result = mihonBackup.mapCategoriesToCollections([
      backupCategory({ id: undefined, name: 'A' }),
      backupCategory({ id: undefined, name: 'B' })
    ])

    expect([...result.keys()]).toEqual([-1, -2])
  })
})

describe('processMangaCommand', () => {
  it('maps a BackupManga into an UpsertMangaCommand, resolving tag names to MangaDex tag ids', () => {
    const result = mihonBackup.processMangaCommand(
      backupManga({ genre: ['Action', 'slice of life'] })
    )

    expect(result.mangaId).toBe(MANGA_ID)
    expect(result.tags).toEqual([
      '391b0423-d847-456f-aff0-8b0cfc03066b',
      'e5301a23-ebd9-49dd-a0cb-2add944c7fe9'
    ])
  })

  it('drops tag names that have no known MangaDex equivalent', () => {
    const result = mihonBackup.processMangaCommand(
      backupManga({ genre: ['Action', 'Not A Real Tag'] })
    )

    expect(result.tags).toEqual(['391b0423-d847-456f-aff0-8b0cfc03066b'])
  })

  it('defaults to an empty tags array when genre is missing', () => {
    const result = mihonBackup.processMangaCommand(backupManga({ genre: undefined }))

    expect(result.tags).toEqual([])
  })

  it('throws when the manga URL has no extractable MangaDex id', () => {
    expect(() =>
      mihonBackup.processMangaCommand(backupManga({ url: 'https://example.com/not-a-manga' }))
    ).toThrow(/unable to extract manga id/i)
  })

  it('falls back to defaults for title, cover, status, authors and artists', () => {
    const result = mihonBackup.processMangaCommand(
      backupManga({
        title: undefined,
        thumbnailUrl: undefined,
        status: undefined,
        author: undefined,
        artist: undefined
      })
    )

    expect(result.title).toBe('Unknown Title')
    expect(result.coverUrl).toBe('')
    expect(result.status).toBe(PublicationStatus.Ongoing)
    expect(result.authors).toEqual([])
    expect(result.artists).toEqual([])
    expect(result.isFavourite).toBe(true)
  })

  it.each([
    [0, PublicationStatus.Ongoing],
    [2, PublicationStatus.Completed],
    [5, PublicationStatus.Cancelled],
    [6, PublicationStatus.Hiatus]
  ])('maps Mihon status %s to %s', (status, expected) => {
    const result = mihonBackup.processMangaCommand(backupManga({ status }))

    expect(result.status).toBe(expected)
  })
})

describe('processCategoryAssignments', () => {
  it('returns an empty array when the category map is empty', () => {
    expect(mihonBackup.processCategoryAssignments([1], MANGA_ID, new Map())).toEqual([])
  })

  it('returns an empty array when the manga has no categories', () => {
    const categoryMap = new Map([[1, 42]])
    expect(mihonBackup.processCategoryAssignments([], MANGA_ID, categoryMap)).toEqual([])
    expect(
      mihonBackup.processCategoryAssignments(
        undefined as unknown as number[],
        MANGA_ID,
        categoryMap
      )
    ).toEqual([])
  })

  it('builds a command for each category that resolves to a collection id', () => {
    const categoryMap = new Map([
      [1, 42],
      [2, 43]
    ])

    const result = mihonBackup.processCategoryAssignments([1, 2, 99], MANGA_ID, categoryMap)

    expect(result).toEqual([
      { collectionId: 42, mangaId: MANGA_ID },
      { collectionId: 43, mangaId: MANGA_ID }
    ])
  })
})

describe('processProgressCommands', () => {
  it('builds a progress command for a chapter with reading progress, pulling lastReadAt from history', () => {
    const result = mihonBackup.processProgressCommands(
      [backupChapter({ lastPageRead: 5, read: true })],
      [backupHistory({ lastRead: 1700001234 })],
      MANGA_ID
    )

    expect(result).toEqual([
      {
        mangaId: MANGA_ID,
        chapterId: CHAPTER_ID,
        currentPage: 5,
        completed: true,
        lastReadAt: 1700001234
      }
    ])
  })

  it('defaults completed to false and lastReadAt to undefined when there is no matching history', () => {
    const result = mihonBackup.processProgressCommands(
      [backupChapter({ lastPageRead: 3, read: undefined })],
      [],
      MANGA_ID
    )

    expect(result[0]).toEqual({
      mangaId: MANGA_ID,
      chapterId: CHAPTER_ID,
      currentPage: 3,
      completed: false,
      lastReadAt: undefined
    })
  })

  it('skips chapters with no reading progress (lastPageRead 0 or missing)', () => {
    const result = mihonBackup.processProgressCommands(
      [backupChapter({ lastPageRead: 0 }), backupChapter({ lastPageRead: undefined })],
      [],
      MANGA_ID
    )

    expect(result).toEqual([])
  })

  it('skips a chapter whose id cannot be extracted from its url', () => {
    const result = mihonBackup.processProgressCommands(
      [backupChapter({ url: 'https://example.com/not-a-chapter', lastPageRead: 5 })],
      [],
      MANGA_ID
    )

    expect(result).toEqual([])
  })
})

describe('processChapterMetadata', () => {
  it('maps a chapter, converting dateUpload to a Date and falling back to defaults', () => {
    const result = mihonBackup.processChapterMetadata(
      [
        backupChapter({
          dateUpload: 1700000000,
          name: undefined,
          chapterNumber: undefined,
          scanlator: undefined
        })
      ],
      MANGA_ID
    )

    expect(result).toEqual([
      {
        chapterId: CHAPTER_ID,
        mangaId: MANGA_ID,
        title: 'Untitled Chapter',
        chapterNumber: 'Unknown',
        language: 'en',
        publishAt: new Date(1700000000 * 1000),
        scanlationGroup: 'Unknown',
        externalUrl: `/chapter/${CHAPTER_ID}`
      }
    ])
  })

  it('falls back to dateFetch when dateUpload is missing', () => {
    const result = mihonBackup.processChapterMetadata(
      [backupChapter({ dateFetch: 1600000000, dateUpload: undefined })],
      MANGA_ID
    )

    expect(result[0].publishAt).toEqual(new Date(1600000000 * 1000))
  })

  it('falls back to the current time when neither dateUpload nor dateFetch is present', () => {
    vi.setSystemTime(new Date('2026-05-01T00:00:00.000Z'))

    const result = mihonBackup.processChapterMetadata([backupChapter()], MANGA_ID)

    expect(result[0].publishAt).toEqual(new Date('2026-05-01T00:00:00.000Z'))
    vi.useRealTimers()
  })

  it('skips a chapter whose id cannot be extracted from its url', () => {
    const result = mihonBackup.processChapterMetadata(
      [backupChapter({ url: 'https://example.com/not-a-chapter' })],
      MANGA_ID
    )

    expect(result).toEqual([])
  })
})

describe('extractIdFromUrl', () => {
  it.each([
    [`/manga/${MANGA_ID}`, MANGA_ID],
    [`https://mangadex.org/title/${MANGA_ID}`, MANGA_ID],
    [`https://mangadex.org/title/${MANGA_ID}/some-slug`, MANGA_ID]
  ])('extracts the manga id from %s', (url, expected) => {
    expect(mihonBackup.extractIdFromUrl(url, 'manga')).toBe(expected)
  })

  it('returns undefined for a manga url with no UUID', () => {
    expect(mihonBackup.extractIdFromUrl('https://example.com/not-a-manga', 'manga')).toBeUndefined()
  })

  it.each([
    [`/chapter/${CHAPTER_ID}`, CHAPTER_ID],
    [`https://mangadex.org/chapter/${CHAPTER_ID}`, CHAPTER_ID]
  ])('extracts the chapter id from %s', (url, expected) => {
    expect(mihonBackup.extractIdFromUrl(url, 'chapter')).toBe(expected)
  })

  it('returns undefined for a chapter url with no UUID', () => {
    expect(
      mihonBackup.extractIdFromUrl('https://example.com/not-a-chapter', 'chapter')
    ).toBeUndefined()
  })
})
