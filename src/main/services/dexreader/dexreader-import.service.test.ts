import { DexReaderBackup } from '../types/dexreader/backup.type'
import { DexReaderManga } from '../types/dexreader/manga.type'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { DexReaderMangaProgress } from '../types/dexreader/manga-progress.type'
import { DexReaderChapterProgress } from '../types/dexreader/chapter-progress.type'
import { DexReaderMangaReaderOverride } from '../types/dexreader/manga-reader-override.type'
import { LibraryData } from '../types/dexreader/library.type'

vi.mock('../../database/db-connection', () => ({
  databaseConnection: { getDb: vi.fn() }
}))

vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: { batchUpsertManga: vi.fn() }
}))

vi.mock('../../database/repositories/chapter.repo', () => ({
  chapterRepo: { saveChapters: vi.fn() }
}))

vi.mock('../../database/repositories/collection.repo', () => ({
  collectionRepo: {
    getAllCollections: vi.fn(),
    batchCreateCollections: vi.fn(),
    batchAddToCollection: vi.fn()
  }
}))

vi.mock('../../database/repositories/manga-progress.repo', () => ({
  progressRepo: { saveProgress: vi.fn(), updateFirstReadAt: vi.fn() }
}))

vi.mock('../../database/repositories/reader-settings.repo', () => ({
  readerSettingsRepo: { getAllOverridesWithMetadata: vi.fn(), batchUpdateOverrides: vi.fn() }
}))

vi.mock('../helpers/dexreader-import.helper', () => ({
  dexreaderImport: {
    processUpsertMangaCommand: vi.fn(),
    processSaveChapterCommand: vi.fn(),
    processCreateCollectionCommand: vi.fn(),
    processAddToCollectionCommand: vi.fn(),
    processSaveProgressCommand: vi.fn(),
    processUpdateFirstReadCommand: vi.fn(),
    processSaveReaderOverrideCommand: vi.fn()
  }
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

import { dexreaderImportService } from './dexreader-import.service'
import { databaseConnection } from '../../database/db-connection'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { readerSettingsRepo } from '../../database/repositories/reader-settings.repo'
import { dexreaderImport } from '../helpers/dexreader-import.helper'
import fs from 'node:fs/promises'
import protobuf from 'protobufjs'
import Pako from 'pako'

const TX_MARKER = 'tx-marker'

function mangaItem(overrides: Partial<DexReaderManga> = {}): DexReaderManga {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    status: 'ongoing',
    isFavourite: true,
    addedAt: 0,
    updatedAt: 0,
    lastAccessedAt: 0,
    externalLinks: {},
    tags: [],
    authors: [],
    artists: [],
    alternativeTitles: {},
    ...overrides
  }
}

function chapterItem(overrides: Partial<DexReaderChapter> = {}): DexReaderChapter {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    language: 'en',
    publishAt: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides
  }
}

function collectionItem(overrides: Partial<DexReaderCollection> = {}): DexReaderCollection {
  return { id: 1, name: 'Favourites', createdAt: 0, updatedAt: 0, ...overrides }
}

function collectionItemLink(
  overrides: Partial<DexReaderCollectionItem> = {}
): DexReaderCollectionItem {
  return { collectionId: 1, mangaId: 'manga-1', addedAt: 0, position: 0, ...overrides }
}

function mangaProgressItem(
  overrides: Partial<DexReaderMangaProgress> = {}
): DexReaderMangaProgress {
  return {
    mangaId: 'manga-1',
    lastChapterId: 'chapter-1',
    firstReadAt: 0,
    lastReadAt: 0,
    ...overrides
  }
}

function chapterProgressItem(
  overrides: Partial<DexReaderChapterProgress> = {}
): DexReaderChapterProgress {
  return {
    mangaId: 'manga-1',
    chapterId: 'chapter-1',
    currentPage: 0,
    completed: false,
    lastReadAt: 0,
    ...overrides
  }
}

function readerOverrideItem(
  overrides: Partial<DexReaderMangaReaderOverride> = {}
): DexReaderMangaReaderOverride {
  return {
    mangaId: 'manga-1',
    readingMode: 'single-page',
    createdAt: 0,
    updatedAt: 0,
    ...overrides
  }
}

function backupPayload(overrides: Partial<DexReaderBackup> = {}): DexReaderBackup {
  return {
    schemaVersion: 1,
    exportedAt: 1700000000000,
    appVersion: '1.14.0',
    library: { mangaList: [], chapterList: [] },
    ...overrides
  }
}

function mockDecodedBackup(data: DexReaderBackup): void {
  vi.mocked(protobuf.load).mockResolvedValue({
    lookupType: vi.fn(() => ({
      decode: vi.fn(() => ({ toJSON: () => data }))
    }))
  } as never)
}

describe('DexReaderImportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from([1]))
    vi.mocked(Pako.ungzip).mockReturnValue(new Uint8Array([1]))
    mockDecodedBackup(backupPayload())

    vi.mocked(databaseConnection.getDb).mockReturnValue({
      transaction: vi.fn((cb: (tx: unknown) => void) => cb(TX_MARKER))
    } as never)

    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([])
    vi.mocked(collectionRepo.batchCreateCollections).mockReturnValue([])
    vi.mocked(readerSettingsRepo.getAllOverridesWithMetadata).mockReturnValue([])

    vi.mocked(dexreaderImport.processUpsertMangaCommand).mockImplementation((it) => it as never)
    vi.mocked(dexreaderImport.processSaveChapterCommand).mockImplementation((it) => it as never)
    vi.mocked(dexreaderImport.processCreateCollectionCommand).mockImplementation(
      (it) => it as never
    )
    vi.mocked(dexreaderImport.processSaveProgressCommand).mockImplementation((it) => it as never)
    vi.mocked(dexreaderImport.processUpdateFirstReadCommand).mockImplementation((it) => it as never)
    vi.mocked(dexreaderImport.processSaveReaderOverrideCommand).mockImplementation(
      (it) => it as never
    )
  })

  it('reads, ungzips, and protobuf-decodes the backup file before importing', async () => {
    await dexreaderImportService.importLibrary('/path/to/backup.dexreader')

    expect(fs.readFile).toHaveBeenCalledWith('/path/to/backup.dexreader')
    expect(Pako.ungzip).toHaveBeenCalledWith(Buffer.from([1]))
    expect(protobuf.load).toHaveBeenCalled()
  })

  it('rejects an incompatible major schema version before touching the database', async () => {
    mockDecodedBackup(backupPayload({ schemaVersion: 2 }))

    await expect(dexreaderImportService.importLibrary('/f')).rejects.toThrow(
      /incompatible schema version/i
    )
    expect(mangaRepo.batchUpsertManga).not.toHaveBeenCalled()
  })

  it('imports manga and chapters inside a single transaction, counting only favourite manga', async () => {
    mockDecodedBackup(
      backupPayload({
        library: {
          mangaList: [
            mangaItem({ mangaId: 'm1', isFavourite: true }),
            mangaItem({ mangaId: 'm2', isFavourite: false })
          ],
          chapterList: [chapterItem({ chapterId: 'c1' })]
        }
      })
    )

    const result = await dexreaderImportService.importLibrary('/f')

    expect(result.importedMangaCount).toBe(1)
    expect(result.importedChaptersCount).toBe(1)
    expect(mangaRepo.batchUpsertManga).toHaveBeenCalledWith(expect.any(Array), TX_MARKER)
    expect(chapterRepo.saveChapters).toHaveBeenCalledWith(expect.any(Array), TX_MARKER)
  })

  it('skips the chapter loop entirely when the backup has no chapterList', async () => {
    mockDecodedBackup(
      backupPayload({
        library: { mangaList: [mangaItem()] } as unknown as LibraryData
      })
    )

    const result = await dexreaderImportService.importLibrary('/f')

    expect(result.importedChaptersCount).toBe(0)
    expect(chapterRepo.saveChapters).toHaveBeenCalledWith([], TX_MARKER)
  })

  describe('collections', () => {
    it('merges with an existing collection by name instead of creating a duplicate', async () => {
      vi.mocked(collectionRepo.getAllCollections).mockReturnValue([
        { id: 99, name: 'Favourites' } as never
      ])
      mockDecodedBackup(
        backupPayload({
          collections: {
            collectionList: [collectionItem({ id: 10, name: 'Favourites' })],
            collectionItems: [collectionItemLink({ collectionId: 10, mangaId: 'manga-1' })]
          }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(collectionRepo.batchCreateCollections).not.toHaveBeenCalled()
      expect(result.skippedCollectionsCount).toBe(1)
      expect(result.importedCollectionItemsCount).toBe(1)
      expect(collectionRepo.batchAddToCollection).toHaveBeenCalledWith(
        [{ collectionId: 99, mangaId: 'manga-1' }],
        TX_MARKER
      )
    })

    it('creates new collections and remaps their ids before adding items', async () => {
      vi.mocked(collectionRepo.getAllCollections).mockReturnValue([])
      vi.mocked(collectionRepo.batchCreateCollections).mockReturnValue([555])
      mockDecodedBackup(
        backupPayload({
          collections: {
            collectionList: [collectionItem({ id: 10, name: 'New Collection' })],
            collectionItems: [collectionItemLink({ collectionId: 10, mangaId: 'manga-1' })]
          }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.importedCollectionsCount).toBe(1)
      expect(result.skippedCollectionsCount).toBe(0)
      expect(collectionRepo.batchAddToCollection).toHaveBeenCalledWith(
        [{ collectionId: 555, mangaId: 'manga-1' }],
        TX_MARKER
      )
    })

    it('defensively skips items referencing a collection that was never imported', async () => {
      mockDecodedBackup(
        backupPayload({
          collections: {
            collectionList: [],
            collectionItems: [collectionItemLink({ collectionId: 404, mangaId: 'manga-1' })]
          }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.importedCollectionItemsCount).toBe(0)
      expect(collectionRepo.batchAddToCollection).not.toHaveBeenCalled()
    })

    it('records a section error and resets counts when the collections import throws, without failing the whole import', async () => {
      vi.mocked(collectionRepo.getAllCollections).mockImplementation(() => {
        throw new Error('collections boom')
      })
      mockDecodedBackup(
        backupPayload({
          library: { mangaList: [mangaItem()], chapterList: [] },
          collections: {
            collectionList: [collectionItem()],
            collectionItems: [collectionItemLink()]
          }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.sectionErrors.collection).toBe('collections boom')
      expect(result.importedCollectionsCount).toBe(0)
      expect(result.importedCollectionItemsCount).toBe(0)
      expect(result.importedMangaCount).toBe(1)
    })
  })

  describe('progress', () => {
    it('saves chapter progress then patches firstReadAt from manga progress', async () => {
      mockDecodedBackup(
        backupPayload({
          progress: {
            mangaProgress: [mangaProgressItem()],
            chapterProgress: [chapterProgressItem()]
          }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.importedMangaProgressCount).toBe(1)
      expect(progressRepo.saveProgress).toHaveBeenCalledWith(expect.any(Array))
      expect(progressRepo.updateFirstReadAt).toHaveBeenCalledWith(expect.any(Array))
    })

    it('does nothing when chapterProgress is empty, even if mangaProgress has entries', async () => {
      mockDecodedBackup(
        backupPayload({
          progress: { mangaProgress: [mangaProgressItem()], chapterProgress: [] }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.importedMangaProgressCount).toBe(0)
      expect(progressRepo.saveProgress).not.toHaveBeenCalled()
      expect(progressRepo.updateFirstReadAt).not.toHaveBeenCalled()
    })

    it('records a section error when progress import throws, without failing the whole import', async () => {
      vi.mocked(progressRepo.saveProgress).mockImplementation(() => {
        throw new Error('progress boom')
      })
      mockDecodedBackup(
        backupPayload({
          library: { mangaList: [mangaItem()], chapterList: [] },
          progress: { mangaProgress: [], chapterProgress: [chapterProgressItem()] }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.sectionErrors.progress).toBe('progress boom')
      expect(result.importedMangaProgressCount).toBe(0)
      expect(result.importedMangaCount).toBe(1)
    })
  })

  describe('reader settings overrides', () => {
    it('skips overrides for manga that already have one, importing only the rest', async () => {
      vi.mocked(readerSettingsRepo.getAllOverridesWithMetadata).mockReturnValue([
        { mangaId: 'manga-1' } as never
      ])
      mockDecodedBackup(
        backupPayload({
          readerSettings: {
            overrides: [
              readerOverrideItem({ mangaId: 'manga-1' }),
              readerOverrideItem({ mangaId: 'manga-2' })
            ]
          }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.skippedReaderSettingsCount).toBe(1)
      expect(result.importedReaderOverridesCount).toBe(1)
      expect(readerSettingsRepo.batchUpdateOverrides).toHaveBeenCalledWith(expect.any(Array))
      expect(
        (readerSettingsRepo.batchUpdateOverrides as ReturnType<typeof vi.fn>).mock.calls[0][0]
      ).toHaveLength(1)
    })

    it('does nothing when every override is skipped', async () => {
      vi.mocked(readerSettingsRepo.getAllOverridesWithMetadata).mockReturnValue([
        { mangaId: 'manga-1' } as never
      ])
      mockDecodedBackup(
        backupPayload({
          readerSettings: { overrides: [readerOverrideItem({ mangaId: 'manga-1' })] }
        })
      )

      await dexreaderImportService.importLibrary('/f')

      expect(readerSettingsRepo.batchUpdateOverrides).not.toHaveBeenCalled()
    })

    it('records a section error when reader settings import throws, without failing the whole import', async () => {
      vi.mocked(readerSettingsRepo.batchUpdateOverrides).mockImplementation(() => {
        throw new Error('reader settings boom')
      })
      mockDecodedBackup(
        backupPayload({
          library: { mangaList: [mangaItem()], chapterList: [] },
          readerSettings: { overrides: [readerOverrideItem()] }
        })
      )

      const result = await dexreaderImportService.importLibrary('/f')

      expect(result.sectionErrors.readerSettings).toBe('reader settings boom')
      expect(result.importedReaderOverridesCount).toBe(0)
      expect(result.importedMangaCount).toBe(1)
    })
  })

  describe('cancellation', () => {
    it('aborts a previous in-flight import when a new one begins', async () => {
      let resolveFirstRead: (buf: Buffer) => void = () => {}
      const firstReadPromise = new Promise<Buffer>((resolve) => {
        resolveFirstRead = resolve
      })
      vi.mocked(fs.readFile)
        .mockImplementationOnce(() => firstReadPromise as never)
        .mockResolvedValueOnce(Buffer.from([2]))

      const firstImport = dexreaderImportService.importLibrary('/first')
      const secondImport = dexreaderImportService.importLibrary('/second')

      resolveFirstRead(Buffer.from([1]))

      await expect(firstImport).rejects.toThrow()
      await expect(secondImport).resolves.toBeDefined()
    })

    it('cancelImport aborts the currently running import', async () => {
      let resolveRead: (buf: Buffer) => void = () => {}
      const readPromise = new Promise<Buffer>((resolve) => {
        resolveRead = resolve
      })
      vi.mocked(fs.readFile).mockImplementationOnce(() => readPromise as never)

      const importPromise = dexreaderImportService.importLibrary('/f')
      dexreaderImportService.cancelImport()
      resolveRead(Buffer.from([1]))

      await expect(importPromise).rejects.toThrow()
    })
  })
})
