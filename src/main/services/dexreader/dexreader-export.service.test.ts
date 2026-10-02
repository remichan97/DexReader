import { ReadingMode } from '@shared/enums/settings/reading-mode.enum'
import { MangaOverrideContract } from '@shared/contracts/database/manga/manga-override.contract'
import { DexreaderExportCommand } from '@shared/commands/services/dexreader-export.command'

vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: { getAllManga: vi.fn(), getLibraryMangaForExport: vi.fn() }
}))

vi.mock('../../database/repositories/chapter.repo', () => ({
  chapterRepo: { getChaptersByMangaIds: vi.fn() }
}))

vi.mock('../../database/repositories/collection.repo', () => ({
  collectionRepo: { getAllCollections: vi.fn(), getAllCollectionItems: vi.fn() }
}))

vi.mock('../../database/repositories/manga-progress.repo', () => ({
  progressRepo: { getAllMangaProgress: vi.fn(), getAllChapterProgressForAllManga: vi.fn() }
}))

vi.mock('../../database/repositories/reader-settings.repo', () => ({
  readerSettingsRepo: { getAllOverridesWithMetadata: vi.fn() }
}))

vi.mock('../helpers/dexreader-export.helper', () => ({
  dexreaderExport: {
    buildMangaData: vi.fn(),
    buildChapterData: vi.fn(),
    buildCollectionData: vi.fn(),
    buildCollectionItemData: vi.fn(),
    buildMangaProgressData: vi.fn(),
    buildChapterProgressData: vi.fn()
  }
}))

vi.mock('node:fs/promises', () => ({
  default: { writeFile: vi.fn() }
}))

vi.mock('protobufjs', () => ({
  default: { load: vi.fn() }
}))

vi.mock('pako', () => ({
  default: { gzip: vi.fn() }
}))

import { dexreaderExportService } from './dexreader-export.service'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { readerSettingsRepo } from '../../database/repositories/reader-settings.repo'
import { dexreaderExport } from '../helpers/dexreader-export.helper'
import fs from 'node:fs/promises'
import protobuf from 'protobufjs'
import Pako from 'pako'

const ENCODED_BUFFER = Buffer.from([1, 2, 3])
const COMPRESSED_BUFFER = Buffer.from([9, 9, 9])

let createMock: ReturnType<typeof vi.fn>

function mockProtobuf(): void {
  createMock = vi.fn((obj: unknown) => obj)
  const encode = vi.fn(() => ({ finish: () => ENCODED_BUFFER }))
  vi.mocked(protobuf.load).mockResolvedValue({
    lookupType: vi.fn(() => ({ create: createMock, encode }))
  } as never)
}

function exportOptions(overrides: Partial<DexreaderExportCommand> = {}): DexreaderExportCommand {
  return {
    includeCollections: false,
    includeProgress: false,
    includeReaderSettings: false,
    ...overrides
  }
}

function favouriteManga(id: string, isFavourite = true): never {
  return { mangaId: id, isFavourite } as never
}

function readerOverride(overrides: Partial<MangaOverrideContract> = {}): MangaOverrideContract {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    readerSettings: { readingMode: ReadingMode.SinglePage },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  }
}

describe('DexReaderExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProtobuf()
    vi.mocked(Pako.gzip).mockReturnValue(COMPRESSED_BUFFER as never)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(mangaRepo.getLibraryMangaForExport).mockReturnValue([favouriteManga('manga-1')])
    vi.mocked(mangaRepo.getAllManga).mockReturnValue([favouriteManga('manga-1')])
    vi.mocked(chapterRepo.getChaptersByMangaIds).mockReturnValue([])
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([])
    vi.mocked(collectionRepo.getAllCollectionItems).mockReturnValue([])
    vi.mocked(progressRepo.getAllMangaProgress).mockReturnValue([])
    vi.mocked(progressRepo.getAllChapterProgressForAllManga).mockReturnValue([])
    vi.mocked(readerSettingsRepo.getAllOverridesWithMetadata).mockReturnValue([])
    vi.mocked(dexreaderExport.buildMangaData).mockImplementation((it) => it as never)
    vi.mocked(dexreaderExport.buildChapterData).mockImplementation((it) => it as never)
    vi.mocked(dexreaderExport.buildCollectionData).mockImplementation((it) => it as never)
    vi.mocked(dexreaderExport.buildCollectionItemData).mockImplementation((it) => it as never)
    vi.mocked(dexreaderExport.buildMangaProgressData).mockImplementation((it) => it as never)
    vi.mocked(dexreaderExport.buildChapterProgressData).mockImplementation((it) => it as never)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws when there is no favourite manga in the library, without writing a file', async () => {
    vi.mocked(mangaRepo.getLibraryMangaForExport).mockReturnValue([
      favouriteManga('manga-1', false)
    ])

    await expect(
      dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())
    ).rejects.toThrow(/no manga in library/i)
    expect(fs.writeFile).not.toHaveBeenCalled()
  })

  it('uses getLibraryMangaForExport when no optional section is requested', async () => {
    await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())

    expect(mangaRepo.getLibraryMangaForExport).toHaveBeenCalled()
    expect(mangaRepo.getAllManga).not.toHaveBeenCalled()
  })

  it.each([
    ['includeCollections', { includeCollections: true }],
    ['includeProgress', { includeProgress: true }],
    ['includeReaderSettings', { includeReaderSettings: true }]
  ])(
    'uses getAllManga instead when %s is requested, to avoid FK violations on non-favourite manga',
    async (_label, override) => {
      await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions(override))

      expect(mangaRepo.getAllManga).toHaveBeenCalled()
      expect(mangaRepo.getLibraryMangaForExport).not.toHaveBeenCalled()
    }
  )

  it('returns the exported counts and writes the gzip-compressed backup to savePath', async () => {
    vi.mocked(mangaRepo.getLibraryMangaForExport).mockReturnValue([
      favouriteManga('manga-1'),
      favouriteManga('manga-2')
    ])
    vi.mocked(chapterRepo.getChaptersByMangaIds).mockReturnValue([
      { chapterId: 'c1' } as never,
      { chapterId: 'c2' } as never,
      { chapterId: 'c3' } as never
    ])

    const result = await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())

    expect(result).toEqual({
      filePath: '/out.dexreader',
      exportedMangaCount: 2,
      exportedChaptersCount: 3,
      exportedCollectionsCount: 0,
      exportedProgressCount: 0,
      exportedReaderSettingsCount: 0
    })
    expect(fs.writeFile).toHaveBeenCalledWith('/out.dexreader', COMPRESSED_BUFFER)
  })

  it('gzips the encoded protobuf buffer before writing it to disk', async () => {
    await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())

    expect(Pako.gzip).toHaveBeenCalledWith(ENCODED_BUFFER)
  })

  it('builds the backup payload with schemaVersion 1, the current app version, and an exportedAt timestamp', async () => {
    vi.setSystemTime(new Date('2026-03-01T12:00:00.000Z'))

    await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 1,
        appVersion: '1.14.0',
        exportedAt: new Date('2026-03-01T12:00:00.000Z').getTime()
      })
    )
  })

  it('omits collections, progress, and reader settings from the payload when none are requested', async () => {
    await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())

    const backupArg = createMock.mock.calls[0][0] as Record<string, unknown>
    expect(backupArg.collections).toBeUndefined()
    expect(backupArg.progress).toBeUndefined()
    expect(backupArg.readerSettings).toBeUndefined()
  })

  it('does not query collection data at all when includeCollections is false', async () => {
    await dexreaderExportService.exportLibrary('/out.dexreader', exportOptions())

    expect(collectionRepo.getAllCollections).not.toHaveBeenCalled()
    expect(collectionRepo.getAllCollectionItems).not.toHaveBeenCalled()
  })

  it('omits the collections section when requested but there is no actual data', async () => {
    await dexreaderExportService.exportLibrary(
      '/out.dexreader',
      exportOptions({ includeCollections: true })
    )

    const backupArg = createMock.mock.calls[0][0] as Record<string, unknown>
    expect(backupArg.collections).toBeUndefined()
  })

  it('includes the collections section and its count when there is data', async () => {
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([{ id: 1 } as never])
    vi.mocked(collectionRepo.getAllCollectionItems).mockReturnValue([{ collectionId: 1 } as never])

    const result = await dexreaderExportService.exportLibrary(
      '/out.dexreader',
      exportOptions({ includeCollections: true })
    )

    expect(result.exportedCollectionsCount).toBe(1)
    const backupArg = createMock.mock.calls[0][0] as { collections?: { collectionList: unknown[] } }
    expect(backupArg.collections?.collectionList).toHaveLength(1)
  })

  it('omits the progress section when requested but there is no actual data', async () => {
    const result = await dexreaderExportService.exportLibrary(
      '/out.dexreader',
      exportOptions({ includeProgress: true })
    )

    expect(result.exportedProgressCount).toBe(0)
    const backupArg = createMock.mock.calls[0][0] as Record<string, unknown>
    expect(backupArg.progress).toBeUndefined()
  })

  it('computes exportedProgressCount as the sum of manga and chapter progress', async () => {
    vi.mocked(progressRepo.getAllMangaProgress).mockReturnValue([{ mangaId: 'm1' } as never])
    vi.mocked(progressRepo.getAllChapterProgressForAllManga).mockReturnValue([
      { chapterId: 'c1' } as never,
      { chapterId: 'c2' } as never
    ])

    const result = await dexreaderExportService.exportLibrary(
      '/out.dexreader',
      exportOptions({ includeProgress: true })
    )

    expect(result.exportedProgressCount).toBe(3)
  })

  it('omits the reader settings section when requested but there is no actual data', async () => {
    const result = await dexreaderExportService.exportLibrary(
      '/out.dexreader',
      exportOptions({ includeReaderSettings: true })
    )

    expect(result.exportedReaderSettingsCount).toBe(0)
    const backupArg = createMock.mock.calls[0][0] as Record<string, unknown>
    expect(backupArg.readerSettings).toBeUndefined()
  })

  it('includes reader settings overrides, applying the doublePageMode fallback and unix timestamps', async () => {
    vi.mocked(readerSettingsRepo.getAllOverridesWithMetadata).mockReturnValue([readerOverride()])

    const result = await dexreaderExportService.exportLibrary(
      '/out.dexreader',
      exportOptions({ includeReaderSettings: true })
    )

    expect(result.exportedReaderSettingsCount).toBe(1)
    const backupArg = createMock.mock.calls[0][0] as {
      readerSettings?: { overrides: Array<Record<string, unknown>> }
    }
    expect(backupArg.readerSettings?.overrides[0]).toEqual({
      mangaId: 'manga-1',
      readingMode: ReadingMode.SinglePage,
      doublePageMode: undefined,
      createdAt: Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000),
      updatedAt: Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000)
    })
  })
})
