vi.mock('../helpers/mihon-backup.helper', () => ({
  mihonBackup: {
    mapCategoriesToCollections: vi.fn(),
    extractIdFromUrl: vi.fn(),
    processMangaCommand: vi.fn(),
    processCategoryAssignments: vi.fn(),
    processChapterMetadata: vi.fn(),
    processProgressCommands: vi.fn()
  }
}))

vi.mock('../../database/repositories/collection.repo', () => ({
  collectionRepo: { batchAddToCollection: vi.fn() }
}))

vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: { getLibraryMangaByCustomCondition: vi.fn(), batchUpsertManga: vi.fn() }
}))

vi.mock('../../database/repositories/manga-progress.repo', () => ({
  progressRepo: { saveProgress: vi.fn() }
}))

vi.mock('../../database/repositories/chapter.repo', () => ({
  chapterRepo: { saveChapters: vi.fn() }
}))

vi.mock('node:fs/promises', () => ({
  default: { readFile: vi.fn() }
}))

vi.mock('./mihon-backup.decoder', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./mihon-backup.decoder')>()),
  decodeBackup: vi.fn()
}))

import { mihonBackupService } from './mihon-backup.service'
import { decodeBackup } from './mihon-backup.decoder'
import { mihonBackup } from '../helpers/mihon-backup.helper'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import fs from 'node:fs/promises'
import { Backup } from '../types/mihon/backup.type'
import { BackupManga } from '../types/mihon/backup-manga.type'

const MANGADEX_SOURCE = '2499283573021220255'
// A second MangaDex source: same name, another language, so another id
const MANGADEX_VIETNAMESE_SOURCE = '9194073792736219759'
const OTHER_SITE_SOURCE = '1234567890'

const MANGADEX_SOURCES = [
  { name: 'MangaDex', sourceId: MANGADEX_SOURCE },
  { name: 'MangaDex', sourceId: MANGADEX_VIETNAMESE_SOURCE },
  { name: 'Some Other Site', sourceId: OTHER_SITE_SOURCE }
]

function backupManga(overrides: Partial<BackupManga> = {}): BackupManga {
  return {
    source: MANGADEX_SOURCE,
    url: '/manga/manga-1',
    title: 'Berserk',
    history: [],
    chapters: [],
    categories: [],
    ...overrides
  }
}

function mockDecodedBackup(data: Partial<Backup>): void {
  vi.mocked(decodeBackup).mockResolvedValue({
    backupManga: [],
    backupCategories: [],
    backupSources: [],
    ...data
  })
}

const NOTHING_LEFT_OUT = { skippedOtherLanguage: [], ignoredOtherSourceCount: 0 }

describe('MihonBackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from([1]))
    mockDecodedBackup({})

    vi.mocked(mihonBackup.mapCategoriesToCollections).mockReturnValue(new Map())
    vi.mocked(mihonBackup.extractIdFromUrl).mockImplementation((url: string) =>
      url.startsWith('/manga/') ? url.replace('/manga/', '') : undefined
    )
    vi.mocked(mihonBackup.processMangaCommand).mockImplementation(
      (manga) => ({ mangaId: manga.url.replace('/manga/', ''), title: manga.title }) as never
    )
    vi.mocked(mihonBackup.processCategoryAssignments).mockReturnValue([])
    vi.mocked(mihonBackup.processChapterMetadata).mockReturnValue([])
    vi.mocked(mihonBackup.processProgressCommands).mockReturnValue([])
    vi.mocked(mangaRepo.getLibraryMangaByCustomCondition).mockReturnValue([])
  })

  it('reads the file and hands its bytes to the decoder', async () => {
    await mihonBackupService.importFromBackup('/path/to/backup.tachibk')

    expect(fs.readFile).toHaveBeenCalledWith('/path/to/backup.tachibk')
    expect(decodeBackup).toHaveBeenCalledWith(Buffer.from([1]))
  })

  it('reports a file that has gone missing with its own error code', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(
      Object.assign(new Error("ENOENT: no such file, open '/f'"), { code: 'ENOENT' })
    )

    await expect(mihonBackupService.importFromBackup('/f')).rejects.toMatchObject({
      code: 'MIHON_BACKUP_FILE_MISSING'
    })
  })

  it('lets any other read failure through unchanged', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(
      Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
    )

    await expect(mihonBackupService.importFromBackup('/f')).rejects.toThrow('EACCES')
  })

  it('lets a decoder failure reach the caller', async () => {
    vi.mocked(decodeBackup).mockRejectedValue(new Error('JSON backups are not supported'))

    await expect(mihonBackupService.importFromBackup('/f')).rejects.toThrow(
      'JSON backups are not supported'
    )
  })

  it('returns an empty result for a backup with no manga', async () => {
    const result = await mihonBackupService.importFromBackup('/f')

    expect(result).toEqual({
      importedMangaCount: 0,
      failedMangaCount: 0,
      skippedMangaCount: 0,
      ...NOTHING_LEFT_OUT
    })
    expect(mangaRepo.batchUpsertManga).not.toHaveBeenCalled()
  })

  it('treats a manga with no explicit favorite flag as favourite by default', async () => {
    mockDecodedBackup({ backupManga: [backupManga({ favorite: undefined })] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.importedMangaCount).toBe(1)
  })

  it('excludes a manga explicitly marked as not favourite', async () => {
    mockDecodedBackup({ backupManga: [backupManga({ favorite: false })] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result).toEqual({
      importedMangaCount: 0,
      failedMangaCount: 0,
      skippedMangaCount: 0,
      ...NOTHING_LEFT_OUT
    })
  })

  it('counts a manga whose id cannot be extracted as failed, with an "Invalid manga URL" reason', async () => {
    vi.mocked(mihonBackup.extractIdFromUrl).mockReturnValue(undefined)
    mockDecodedBackup({ backupManga: [backupManga({ url: 'not-a-valid-url', title: undefined })] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.failedMangaCount).toBe(1)
    expect(result.errors).toEqual([
      { mangaId: 'not-a-valid-url', title: 'Unknown Title', reason: 'Invalid manga URL' }
    ])
  })

  it('skips a manga that already exists in the library', async () => {
    vi.mocked(mangaRepo.getLibraryMangaByCustomCondition).mockReturnValue([
      { mangaId: 'manga-1' } as never
    ])
    mockDecodedBackup({ backupManga: [backupManga()] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.skippedMangaCount).toBe(1)
    expect(result.importedMangaCount).toBe(0)
  })

  it('imports a new manga, aggregating categories/chapters/progress and batching once at the end', async () => {
    vi.mocked(mihonBackup.processCategoryAssignments).mockReturnValue([
      { collectionId: 1, mangaId: 'manga-1' }
    ])
    vi.mocked(mihonBackup.processChapterMetadata).mockReturnValue([{ chapterId: 'c1' } as never])
    vi.mocked(mihonBackup.processProgressCommands).mockReturnValue([{ chapterId: 'c1' } as never])
    mockDecodedBackup({ backupManga: [backupManga()] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.importedMangaCount).toBe(1)
    expect(result.importedMangaIds).toEqual(['manga-1'])
    expect(mangaRepo.batchUpsertManga).toHaveBeenCalledWith([
      { mangaId: 'manga-1', title: 'Berserk' }
    ])
    expect(collectionRepo.batchAddToCollection).toHaveBeenCalledWith([
      { collectionId: 1, mangaId: 'manga-1' }
    ])
    expect(chapterRepo.saveChapters).toHaveBeenCalledWith([{ chapterId: 'c1' }])
    expect(progressRepo.saveProgress).toHaveBeenCalledWith([{ chapterId: 'c1' }])
  })

  it('counts a manga as failed and records the error message when processing throws', async () => {
    vi.mocked(mihonBackup.processMangaCommand).mockImplementation(() => {
      throw new Error('bad manga data')
    })
    mockDecodedBackup({ backupManga: [backupManga()] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.failedMangaCount).toBe(1)
    // The catch block reports manga.url, not the already-extracted mangaId.
    expect(result.errors).toEqual([
      { mangaId: '/manga/manga-1', title: 'Berserk', reason: 'bad manga data' }
    ])
    expect(mangaRepo.batchUpsertManga).toHaveBeenCalledWith([])
  })

  describe('sources other than English MangaDex', () => {
    it('ignores, and counts, entries from a different site', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({ source: OTHER_SITE_SOURCE, url: '/manga/other-site' }),
          backupManga({ source: OTHER_SITE_SOURCE, url: '/manga/other-site-2' })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result).toEqual({
        importedMangaCount: 0,
        failedMangaCount: 0,
        skippedMangaCount: 0,
        skippedOtherLanguage: [],
        ignoredOtherSourceCount: 2
      })
      expect(mangaRepo.batchUpsertManga).not.toHaveBeenCalled()
    })

    it('does not count entries marked as not favourite', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [backupManga({ source: OTHER_SITE_SOURCE, favorite: false })]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.ignoredOtherSourceCount).toBe(0)
    })

    it('leaves a MangaDex entry from another language out of the import and lists it instead', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga(),
          backupManga({
            source: MANGADEX_VIETNAMESE_SOURCE,
            url: '/manga/manga-vi',
            title: 'Truyen Tranh'
          })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.importedMangaIds).toEqual(['manga-1'])
      expect(result.skippedOtherLanguage).toEqual([{ mangaId: 'manga-vi', title: 'Truyen Tranh' }])
      expect(mangaRepo.batchUpsertManga).toHaveBeenCalledWith([
        { mangaId: 'manga-1', title: 'Berserk' }
      ])
    })

    it('still lists other-language entries when nothing in the file is English', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/manga-vi', title: 'B' })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result).toEqual({
        importedMangaCount: 0,
        failedMangaCount: 0,
        skippedMangaCount: 0,
        skippedOtherLanguage: [{ mangaId: 'manga-vi', title: 'B' }],
        ignoredOtherSourceCount: 0
      })
    })

    it('matches the MangaDex source name case-insensitively', async () => {
      mockDecodedBackup({
        backupSources: [{ name: '  mangadex ', sourceId: MANGADEX_VIETNAMESE_SOURCE }],
        backupManga: [backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/m' })]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.skippedOtherLanguage).toHaveLength(1)
    })

    it('cannot tell a source from other sites when its name is blank or missing, so it is only counted', async () => {
      mockDecodedBackup({
        backupSources: [{ name: '', sourceId: MANGADEX_VIETNAMESE_SOURCE }, { sourceId: '777' }],
        backupManga: [
          backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/m1' }),
          backupManga({ source: '777', url: '/manga/m2' }),
          backupManga({ source: '999', url: '/manga/m3' }) // not in the source list at all
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.skippedOtherLanguage).toEqual([])
      expect(result.ignoredOtherSourceCount).toBe(3)
    })

    it('survives an entry whose source is missing or not a number', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({ source: undefined as never }),
          backupManga({ source: 'not-a-number' })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.ignoredOtherSourceCount).toBe(2)
    })

    it('does not offer a title that is already in the library', async () => {
      vi.mocked(mangaRepo.getLibraryMangaByCustomCondition).mockImplementation((condition) =>
        condition.mangaId === 'manga-vi' ? [{ mangaId: 'manga-vi' } as never] : []
      )
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/manga-vi' })]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.skippedOtherLanguage).toEqual([])
    })

    it('does not offer a title that the same file imports from the English source', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({ url: '/manga/same' }),
          backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/same' })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.importedMangaIds).toEqual(['same'])
      expect(result.skippedOtherLanguage).toEqual([])
    })

    it('lists a title only once and in alphabetical order', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/b', title: 'Bravo' }),
          backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/a', title: 'Alpha' }),
          backupManga({ source: MANGADEX_VIETNAMESE_SOURCE, url: '/manga/b', title: 'Bravo' })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.skippedOtherLanguage?.map((entry) => entry.title)).toEqual(['Alpha', 'Bravo'])
    })

    it('falls back to a placeholder for an untitled entry', async () => {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({
            source: MANGADEX_VIETNAMESE_SOURCE,
            url: '/manga/untitled',
            title: undefined
          })
        ]
      })

      const result = await mihonBackupService.importFromBackup('/f')

      expect(result.skippedOtherLanguage).toEqual([{ mangaId: 'untitled', title: 'Unknown Title' }])
    })
  })

  describe('adding back skipped titles', () => {
    function mixedBackup(): void {
      mockDecodedBackup({
        backupSources: MANGADEX_SOURCES,
        backupManga: [
          backupManga({ url: '/manga/english', title: 'English' }),
          backupManga({
            source: MANGADEX_VIETNAMESE_SOURCE,
            url: '/manga/vi-1',
            title: 'Vi One'
          }),
          backupManga({
            source: MANGADEX_VIETNAMESE_SOURCE,
            url: '/manga/vi-2',
            title: 'Vi Two'
          })
        ]
      })
    }

    it('imports only the chosen other-language titles, not the English ones again', async () => {
      mixedBackup()

      const result = await mihonBackupService.importFromBackup('/f', {
        includeMangaIds: ['vi-1']
      })

      expect(result.importedMangaIds).toEqual(['vi-1'])
      expect(mangaRepo.batchUpsertManga).toHaveBeenCalledWith([
        { mangaId: 'vi-1', title: 'Vi One' }
      ])
    })

    it('reports what is still left out afterwards', async () => {
      mixedBackup()

      const result = await mihonBackupService.importFromBackup('/f', {
        includeMangaIds: ['vi-1']
      })

      expect(result.skippedOtherLanguage).toEqual([{ mangaId: 'vi-2', title: 'Vi Two' }])
    })

    it('does not report the ignored-source count a second time', async () => {
      mixedBackup()

      const result = await mihonBackupService.importFromBackup('/f', {
        includeMangaIds: ['vi-1']
      })

      expect(result.ignoredOtherSourceCount).toBeUndefined()
    })

    it('cannot be used to import an English or unlisted entry', async () => {
      mixedBackup()

      const result = await mihonBackupService.importFromBackup('/f', {
        includeMangaIds: ['english', 'not-in-the-file']
      })

      expect(result.importedMangaCount).toBe(0)
      expect(mangaRepo.batchUpsertManga).not.toHaveBeenCalled()
    })

    it('treats an empty selection as nothing to import', async () => {
      mixedBackup()

      const result = await mihonBackupService.importFromBackup('/f', { includeMangaIds: [] })

      expect(result.importedMangaCount).toBe(0)
      expect(result.skippedOtherLanguage).toHaveLength(2)
    })
  })

  describe('cancellation', () => {
    it('marks all remaining manga as skipped once the import is aborted mid-loop', async () => {
      let resolveFirstRead: (buf: Buffer) => void = () => {}
      const firstReadPromise = new Promise<Buffer>((resolve) => {
        resolveFirstRead = resolve
      })
      vi.mocked(fs.readFile)
        .mockImplementationOnce(() => firstReadPromise as never)
        .mockResolvedValueOnce(Buffer.from([2]))
      mockDecodedBackup({ backupManga: [backupManga()] })

      const firstImport = mihonBackupService.importFromBackup('/first')
      const secondImport = mihonBackupService.importFromBackup('/second')

      resolveFirstRead(Buffer.from([1]))

      const firstResult = await firstImport
      expect(firstResult).toEqual({
        importedMangaCount: 0,
        skippedMangaCount: 1,
        failedMangaCount: 0,
        errors: [],
        importedMangaIds: [],
        ...NOTHING_LEFT_OUT
      })

      const secondResult = await secondImport
      expect(secondResult.importedMangaCount).toBe(1)
    })

    it('cancelImport aborts the currently running import', async () => {
      let resolveRead: (buf: Buffer) => void = () => {}
      const readPromise = new Promise<Buffer>((resolve) => {
        resolveRead = resolve
      })
      vi.mocked(fs.readFile).mockImplementationOnce(() => readPromise as never)
      mockDecodedBackup({ backupManga: [backupManga()] })

      const importPromise = mihonBackupService.importFromBackup('/f')
      mihonBackupService.cancelImport()
      resolveRead(Buffer.from([1]))

      const result = await importPromise
      expect(result.skippedMangaCount).toBe(1)
      expect(result.importedMangaCount).toBe(0)
    })
  })
})
