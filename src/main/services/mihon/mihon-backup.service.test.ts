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

vi.mock('protobufjs', () => ({
  default: { load: vi.fn() }
}))

vi.mock('pako', () => ({
  default: { ungzip: vi.fn() }
}))

import { mihonBackupService } from './mihon-backup.service'
import { mihonBackup } from '../helpers/mihon-backup.helper'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import fs from 'node:fs/promises'
import protobuf from 'protobufjs'
import Pako from 'pako'
import { Backup } from '../types/mihon/backup.type'
import { BackupManga } from '../types/mihon/backup-manga.type'

const MANGADEX_SOURCE = '2499283573021220255'

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

function mockDecodedBackup(data: Backup): void {
  vi.mocked(protobuf.load).mockResolvedValue({
    lookupType: vi.fn(() => ({
      decode: vi.fn(() => ({ toJSON: () => data }))
    }))
  } as never)
}

describe('MihonBackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from([1]))
    vi.mocked(Pako.ungzip).mockReturnValue(new Uint8Array([1]))
    mockDecodedBackup({ backupManga: [], backupCategories: [] })

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

  it('reads, ungzips, and protobuf-decodes the backup file', async () => {
    await mihonBackupService.importFromBackup('/path/to/backup.tachibk')

    expect(fs.readFile).toHaveBeenCalledWith('/path/to/backup.tachibk')
    expect(Pako.ungzip).toHaveBeenCalledWith(Buffer.from([1]))
    expect(protobuf.load).toHaveBeenCalled()
  })

  it('filters out manga from a non-MangaDex source', async () => {
    mockDecodedBackup({
      backupManga: [backupManga({ source: '1', url: '/manga/other' })],
      backupCategories: []
    })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result).toEqual({ importedMangaCount: 0, failedMangaCount: 0, skippedMangaCount: 0 })
    expect(mangaRepo.batchUpsertManga).not.toHaveBeenCalled()
  })

  it('treats a manga with no explicit favorite flag as favourite by default', async () => {
    mockDecodedBackup({
      backupManga: [backupManga({ favorite: undefined })],
      backupCategories: []
    })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.importedMangaCount).toBe(1)
  })

  it('excludes a manga explicitly marked as not favourite', async () => {
    mockDecodedBackup({
      backupManga: [backupManga({ favorite: false })],
      backupCategories: []
    })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result).toEqual({ importedMangaCount: 0, failedMangaCount: 0, skippedMangaCount: 0 })
  })

  it('counts a manga whose id cannot be extracted as failed, with an "Invalid manga URL" reason', async () => {
    vi.mocked(mihonBackup.extractIdFromUrl).mockReturnValue(undefined)
    mockDecodedBackup({
      backupManga: [backupManga({ url: 'not-a-valid-url', title: undefined })],
      backupCategories: []
    })

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
    mockDecodedBackup({ backupManga: [backupManga()], backupCategories: [] })

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
    mockDecodedBackup({ backupManga: [backupManga()], backupCategories: [] })

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
    mockDecodedBackup({ backupManga: [backupManga()], backupCategories: [] })

    const result = await mihonBackupService.importFromBackup('/f')

    expect(result.failedMangaCount).toBe(1)
    // The catch block reports manga.url, not the already-extracted mangaId.
    expect(result.errors).toEqual([
      { mangaId: '/manga/manga-1', title: 'Berserk', reason: 'bad manga data' }
    ])
    expect(mangaRepo.batchUpsertManga).toHaveBeenCalledWith([])
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
      mockDecodedBackup({ backupManga: [backupManga()], backupCategories: [] })

      const firstImport = mihonBackupService.importFromBackup('/first')
      const secondImport = mihonBackupService.importFromBackup('/second')

      resolveFirstRead(Buffer.from([1]))

      const firstResult = await firstImport
      expect(firstResult).toEqual({
        importedMangaCount: 0,
        skippedMangaCount: 1,
        failedMangaCount: 0,
        errors: [],
        importedMangaIds: []
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
      mockDecodedBackup({ backupManga: [backupManga()], backupCategories: [] })

      const importPromise = mihonBackupService.importFromBackup('/f')
      mihonBackupService.cancelImport()
      resolveRead(Buffer.from([1]))

      const result = await importPromise
      expect(result.skippedMangaCount).toBe(1)
      expect(result.importedMangaCount).toBe(0)
    })
  })
})
