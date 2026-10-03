vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: { getLibraryManga: vi.fn() }
}))

vi.mock('../../database/repositories/collection.repo', () => ({
  collectionRepo: { getAllCollections: vi.fn(), getAllCollectionItems: vi.fn() }
}))

vi.mock('../../database/repositories/manga-progress.repo', () => ({
  progressRepo: { getAllChapterProgress: vi.fn() }
}))

vi.mock('../../database/repositories/chapter.repo', () => ({
  chapterRepo: { getChapterById: vi.fn() }
}))

vi.mock('../helpers/mihon-export.helper', () => ({
  mihonExport: {
    buildBackupCategory: vi.fn(),
    buildBackupChapter: vi.fn(),
    buildBackupHistory: vi.fn(),
    buildBackupManga: vi.fn()
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

import { mihonExportService } from './mihon-export.service'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { mihonExport } from '../helpers/mihon-export.helper'
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

function libraryManga(id: string): never {
  return { mangaId: id, title: `Manga ${id}` } as never
}

describe('MihonExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProtobuf()
    vi.mocked(Pako.gzip).mockReturnValue(COMPRESSED_BUFFER as never)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([])
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([])
    vi.mocked(collectionRepo.getAllCollectionItems).mockReturnValue([])
    vi.mocked(progressRepo.getAllChapterProgress).mockReturnValue([])
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(undefined)
    vi.mocked(mihonExport.buildBackupCategory).mockImplementation(
      (col, idx) => ({ name: (col as { name: string }).name, order: idx }) as never
    )
    vi.mocked(mihonExport.buildBackupChapter).mockReturnValue({} as never)
    vi.mocked(mihonExport.buildBackupHistory).mockReturnValue({} as never)
    vi.mocked(mihonExport.buildBackupManga).mockImplementation(
      (manga) => ({ url: `/manga/${(manga as { mangaId: string }).mangaId}` }) as never
    )
  })

  it('throws when the library is empty, without writing a file', async () => {
    await expect(mihonExportService.exportMihonData('/out.tachibk')).rejects.toThrow(
      /no manga in library/i
    )
    expect(fs.writeFile).not.toHaveBeenCalled()
  })

  it('writes the gzip-compressed backup to savePath and returns the exported count', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1'), libraryManga('m2')])

    const result = await mihonExportService.exportMihonData('/out.tachibk')

    expect(result).toEqual({ exportedCount: 2 })
    expect(Pako.gzip).toHaveBeenCalledWith(ENCODED_BUFFER)
    expect(fs.writeFile).toHaveBeenCalledWith('/out.tachibk', COMPRESSED_BUFFER)
  })

  it('builds a backup category for every collection, in order', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1')])
    vi.mocked(collectionRepo.getAllCollections).mockReturnValue([
      { id: 1, name: 'Favourites' } as never,
      { id: 2, name: 'Plan to Read' } as never
    ])

    await mihonExportService.exportMihonData('/out.tachibk')

    expect(mihonExport.buildBackupCategory).toHaveBeenNthCalledWith(
      1,
      { id: 1, name: 'Favourites' },
      0
    )
    expect(mihonExport.buildBackupCategory).toHaveBeenNthCalledWith(
      2,
      { id: 2, name: 'Plan to Read' },
      1
    )
  })

  it('groups collection items by mangaId and passes each manga its collection ids', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1')])
    vi.mocked(collectionRepo.getAllCollectionItems).mockReturnValue([
      { collectionId: 1, mangaId: 'm1' } as never,
      { collectionId: 2, mangaId: 'm1' } as never,
      { collectionId: 3, mangaId: 'm2' } as never
    ])

    await mihonExportService.exportMihonData('/out.tachibk')

    expect(mihonExport.buildBackupManga).toHaveBeenCalledWith(
      libraryManga('m1'),
      [1, 2],
      expect.any(Array),
      expect.any(Array)
    )
  })

  it('defaults a manga with no collection items to an empty categories array', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1')])

    await mihonExportService.exportMihonData('/out.tachibk')

    expect(mihonExport.buildBackupManga).toHaveBeenCalledWith(
      libraryManga('m1'),
      [],
      expect.any(Array),
      expect.any(Array)
    )
  })

  it('looks up chapter metadata for each progress entry and forwards it when building the chapter', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1')])
    vi.mocked(progressRepo.getAllChapterProgress).mockReturnValue([
      { mangaId: 'm1', chapterId: 'c1', currentPage: 1, completed: false, lastReadAt: 0 }
    ])
    const metadata = { chapterId: 'c1', title: 'Chapter 1' }
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(metadata as never)

    await mihonExportService.exportMihonData('/out.tachibk')

    expect(chapterRepo.getChapterById).toHaveBeenCalledWith('c1')
    expect(mihonExport.buildBackupChapter).toHaveBeenCalledWith(
      { mangaId: 'm1', chapterId: 'c1', currentPage: 1, completed: false, lastReadAt: 0 },
      metadata
    )
  })

  it('still builds a chapter entry with undefined metadata when the chapter was not found', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1')])
    vi.mocked(progressRepo.getAllChapterProgress).mockReturnValue([
      {
        mangaId: 'm1',
        chapterId: 'missing-chapter',
        currentPage: 1,
        completed: false,
        lastReadAt: 0
      }
    ])
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(undefined)

    await mihonExportService.exportMihonData('/out.tachibk')

    expect(mihonExport.buildBackupChapter).toHaveBeenCalledWith(
      expect.objectContaining({ chapterId: 'missing-chapter' }),
      undefined
    )
  })

  it('builds the protobuf payload from the assembled manga and category lists', async () => {
    vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([libraryManga('m1')])

    await mihonExportService.exportMihonData('/out.tachibk')

    expect(createMock).toHaveBeenCalledWith({
      backupManga: [{ url: '/manga/m1' }],
      backupCategories: []
    })
  })
})
