import type { StatsFs } from 'node:fs'

const mangadexClientMock = vi.hoisted(() => ({
  userAgent: 'DexReader/test',
  getChapter: vi.fn(),
  getChapterImages: vi.fn()
}))

vi.mock('../api/mangadex-client', () => ({
  MangaDexClient: vi.fn(function MangaDexClient() {
    return mangadexClientMock
  })
}))

vi.mock('../api/utils/user-agent.util', () => ({
  buildUserAgent: vi.fn(() => 'DexReader/test')
}))

vi.mock('../database/repositories/chapter-downloads.repo', () => ({
  chapterDownloadsRepo: {
    getDownload: vi.fn(),
    getAllDownloads: vi.fn(),
    createDownload: vi.fn(),
    markDownloadState: vi.fn(),
    deleteDownload: vi.fn(),
    batchDeleteDownloads: vi.fn(),
    getStorageByManga: vi.fn(),
    filterDownloadsByMangaId: vi.fn()
  }
}))

vi.mock('../database/repositories/chapter.repo', () => ({
  chapterRepo: { getChapterById: vi.fn(), saveChapters: vi.fn() }
}))

vi.mock('../filesystem/path-validator', () => ({
  getDownloadsPath: vi.fn(() => '/mock/downloads')
}))

vi.mock('../filesystem/secure-fs', () => ({
  secureFs: { ensureDir: vi.fn(), deleteDir: vi.fn(), statFs: vi.fn() }
}))

vi.mock('./helpers/dexreader-download.helper', () => ({
  downloadData: vi.fn()
}))

vi.mock('../api/utils/disk-cache.util', () => ({
  diskCacheUtil: { emptyDiskCoverCache: vi.fn(), getDiskCacheSize: vi.fn() }
}))

vi.mock('./logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../settings/settings-manager', () => ({
  settingsManager: { getByPath: vi.fn() }
}))

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: vi.fn(() => []) }
}))

import type { downloadService as DownloadServiceSingleton } from './download.service'
import { chapterDownloadsRepo } from '../database/repositories/chapter-downloads.repo'
import { chapterRepo } from '../database/repositories/chapter.repo'
import { secureFs } from '../filesystem/secure-fs'
import { downloadData } from './helpers/dexreader-download.helper'
import { diskCacheUtil } from '../api/utils/disk-cache.util'
import { settingsManager } from '../settings/settings-manager'
import { BrowserWindow } from 'electron'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '@shared/enums/mangadex'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { ChapterWithMetadataContract } from '@shared/contracts/database/manga/chapter-with-metadata.contract'
import { ImageUrlResponse } from '../../shared/responses/image-url.response'
import { DownloadChapterCommand } from '@shared/commands/services/download-chapter.command'
import path from 'node:path'

// The chapterImageCache is a per-instance Map, not reset by vi.clearAllMocks(). Every test
// re-imports a fresh module instance so a cache hit in one test can't leak into the next.
let downloadService: typeof DownloadServiceSingleton

function download(overrides: Partial<ChapterDownloadContract> = {}): ChapterDownloadContract {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Completed,
    downloadedAt: 0,
    downloadsBasePath: '/mock/downloads',
    filePath: 'manga/manga-1/chapters/chapter-1',
    totalPages: 10,
    storageSize: 1024,
    imageQuality: ImageQuality.High,
    imageFormat: '.jpg',
    title: 'Berserk',
    chapterNumber: '1',
    ...overrides
  }
}

function chapterMetadata(
  overrides: Partial<ChapterWithMetadataContract> = {}
): ChapterWithMetadataContract {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    title: 'The Black Swordsman',
    chapterNumber: '1',
    language: 'en',
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  }
}

function downloadOptions(overrides: Partial<DownloadChapterCommand> = {}): DownloadChapterCommand {
  return {
    mangaId: 'manga-1',
    chapterId: 'chapter-1',
    language: 'en',
    quality: ImageQuality.High,
    ...overrides
  }
}

function imageUrl(overrides: Partial<ImageUrlResponse> = {}): ImageUrlResponse {
  return {
    url: 'https://example.com/page.jpg',
    filename: 'page.jpg',
    quality: ImageQuality.High,
    ...overrides
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  vi.resetModules()
  ;({ downloadService } = await import('./download.service'))
  vi.mocked(secureFs.ensureDir).mockResolvedValue(undefined)
  vi.mocked(secureFs.deleteDir).mockResolvedValue(undefined)
  vi.mocked(downloadData).mockResolvedValue({ size: 100, format: '.jpg' })
})

describe('isDownloaded / getAllDownloads', () => {
  it('delegates to the repository', () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())
    vi.mocked(chapterDownloadsRepo.getAllDownloads).mockReturnValue([download()])

    expect(downloadService.isDownloaded('chapter-1')).toEqual(download())
    expect(downloadService.getAllDownloads()).toEqual([download()])
  })
})

describe('getDownloadStats', () => {
  it('sums chapter count and storage size for a manga', () => {
    vi.mocked(chapterDownloadsRepo.filterDownloadsByMangaId).mockReturnValue([
      download({ storageSize: 100 }),
      download({ storageSize: 200 })
    ])

    expect(downloadService.getDownloadStats('manga-1')).toEqual({
      chapterCount: 2,
      totalBytes: 300
    })
  })

  it('treats a missing storageSize as 0', () => {
    vi.mocked(chapterDownloadsRepo.filterDownloadsByMangaId).mockReturnValue([
      download({ storageSize: undefined as unknown as number })
    ])

    expect(downloadService.getDownloadStats('manga-1').totalBytes).toBe(0)
  })
})

describe('getStorageInfo', () => {
  it('aggregates manga storage, disk space, and disk cache size', async () => {
    vi.mocked(chapterDownloadsRepo.getStorageByManga).mockReturnValue({
      totalAppStorage: 1000,
      mangaStorageByTitle: []
    })
    vi.mocked(settingsManager.getByPath).mockReturnValue(undefined)
    vi.mocked(secureFs.statFs).mockResolvedValue({
      bsize: 1024,
      blocks: 1000,
      bfree: 400
    } as StatsFs)
    vi.mocked(diskCacheUtil.getDiskCacheSize).mockResolvedValue({ cacheSize: 500, fileCount: 2 })

    const result = await downloadService.getStorageInfo()

    expect(result).toEqual({
      mangaStorage: { totalAppStorage: 1000, mangaStorageByTitle: [] },
      diskSpace: { total: 1024000, free: 409600, used: 614400 },
      cacheSize: { cacheSize: 500, fileCount: 2 }
    })
  })

  it('uses the configured download path over the default when computing disk space', async () => {
    vi.mocked(chapterDownloadsRepo.getStorageByManga).mockReturnValue({
      totalAppStorage: 0,
      mangaStorageByTitle: []
    })
    vi.mocked(settingsManager.getByPath).mockReturnValue('/custom/path')
    vi.mocked(secureFs.statFs).mockResolvedValue({ bsize: 1, blocks: 1, bfree: 0 } as StatsFs)
    vi.mocked(diskCacheUtil.getDiskCacheSize).mockResolvedValue({ cacheSize: 0, fileCount: 0 })

    await downloadService.getStorageInfo()

    expect(secureFs.statFs).toHaveBeenCalledWith('/custom/path')
  })
})

describe('downloadChapter', () => {
  it('short-circuits with the existing record when the chapter is already downloaded', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(
      download({ status: DownloadStatus.Completed })
    )

    const result = await downloadService.downloadChapter(downloadOptions())

    expect(result).toEqual({
      chapterId: 'chapter-1',
      success: true,
      totalPages: 10,
      storageSize: 1024,
      filePath: path.join('/mock/downloads', 'manga/manga-1/chapters/chapter-1')
    })
    expect(chapterRepo.getChapterById).not.toHaveBeenCalled()
  })

  it('reports success false when the existing record is not in a Completed state', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(
      download({ status: DownloadStatus.Failed })
    )

    const result = await downloadService.downloadChapter(downloadOptions())

    expect(result.success).toBe(false)
  })

  it('uses the cached chapter metadata without calling the API when available', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(chapterMetadata())
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([imageUrl()])

    const result = await downloadService.downloadChapter(downloadOptions())

    expect(mangadexClientMock.getChapter).not.toHaveBeenCalled()
    expect(chapterRepo.saveChapters).toHaveBeenCalledWith([
      expect.objectContaining({ chapterId: 'chapter-1', mangaId: 'manga-1' })
    ])
    expect(chapterDownloadsRepo.createDownload).toHaveBeenCalledWith(
      expect.objectContaining({ chapterId: 'chapter-1', mangaId: 'manga-1', totalPages: 0 })
    )
    expect(result.success).toBe(true)
    expect(result.totalPages).toBe(1)
  })

  it('fetches chapter metadata from the API when there is no local cache', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(undefined)
    vi.mocked(mangadexClientMock.getChapter).mockResolvedValue({
      result: 'ok',
      data: {
        id: 'chapter-1',
        attributes: {
          title: 'The Black Swordsman',
          chapter: '1',
          volume: '1',
          publishAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        relationships: [{ type: 'scanlation_group', attributes: { name: 'Dark Horse' } }]
      }
    })
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([imageUrl()])

    await downloadService.downloadChapter(downloadOptions())

    expect(chapterRepo.saveChapters).toHaveBeenCalledWith([
      expect.objectContaining({ scanlationGroup: 'Dark Horse' })
    ])
  })

  it('throws when the API fails to return chapter metadata', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(undefined)
    vi.mocked(mangadexClientMock.getChapter).mockResolvedValue({ result: 'error', data: undefined })

    await expect(downloadService.downloadChapter(downloadOptions())).rejects.toThrow(
      /failed to fetch chapter metadata/i
    )
    expect(chapterDownloadsRepo.createDownload).not.toHaveBeenCalled()
  })

  it('downloads every page, aggregating storage size and capturing the format from the first page', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(chapterMetadata())
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([
      imageUrl({ url: 'https://example.com/1.png' }),
      imageUrl({ url: 'https://example.com/2.png' })
    ])
    vi.mocked(downloadData)
      .mockResolvedValueOnce({ size: 100, format: '.png' })
      .mockResolvedValueOnce({ size: 200, format: '.png' })

    const result = await downloadService.downloadChapter(downloadOptions())

    expect(result.totalPages).toBe(2)
    expect(result.storageSize).toBe(300)
    expect(chapterDownloadsRepo.markDownloadState).toHaveBeenCalledWith(
      expect.objectContaining({ imageFormat: '.png', isDownloaded: true, storageSize: 300 })
    )
  })

  it('reuses cached image URLs on a second call within the TTL instead of refetching', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(chapterMetadata())
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([imageUrl()])

    await downloadService.downloadChapter(downloadOptions())
    await downloadService.downloadChapter(downloadOptions())

    expect(mangadexClientMock.getChapterImages).toHaveBeenCalledTimes(1)
  })

  it('marks the download failed, cleans up the partial directory, and rethrows when a page download fails', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(chapterMetadata())
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([imageUrl()])
    vi.mocked(downloadData).mockRejectedValue(new Error('network error'))

    await expect(downloadService.downloadChapter(downloadOptions())).rejects.toThrow(
      'network error'
    )

    expect(chapterDownloadsRepo.markDownloadState).toHaveBeenCalledWith(
      expect.objectContaining({ isFailed: true })
    )
    expect(secureFs.deleteDir).toHaveBeenCalled()
  })

  it('emits progress to the focused browser window after each batch', async () => {
    const send = vi.fn()
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([{ webContents: { send } }] as never)
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(chapterMetadata())
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([imageUrl()])

    await downloadService.downloadChapter(downloadOptions())

    expect(send).toHaveBeenCalledWith(
      'download:chapter-progress',
      expect.objectContaining({ chapterId: 'chapter-1', status: DownloadStatus.Completed })
    )
  })

  it('does nothing when there is no browser window open', async () => {
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([])
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)
    vi.mocked(chapterRepo.getChapterById).mockReturnValue(chapterMetadata())
    vi.mocked(mangadexClientMock.getChapterImages).mockResolvedValue([imageUrl()])

    await expect(downloadService.downloadChapter(downloadOptions())).resolves.toBeDefined()
  })
})

describe('deleteChapter', () => {
  it('throws when there is no download record for the chapter', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(undefined)

    await expect(
      downloadService.deleteChapter({ chapterId: 'missing', isDeletePermanent: false })
    ).rejects.toThrow(/no download found/i)
  })

  it('deletes the chapter files and the database record on a permanent delete', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())

    await downloadService.deleteChapter({ chapterId: 'chapter-1', isDeletePermanent: true })

    expect(secureFs.deleteDir).toHaveBeenCalledWith(
      path.join('/mock/downloads', 'manga/manga-1/chapters/chapter-1')
    )
    expect(chapterDownloadsRepo.deleteDownload).toHaveBeenCalledWith({
      chapterId: 'chapter-1',
      isDeletePermanent: true
    })
  })

  it('skips the filesystem delete for a soft (hide) delete', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())

    await downloadService.deleteChapter({ chapterId: 'chapter-1', isDeletePermanent: false })

    expect(secureFs.deleteDir).not.toHaveBeenCalled()
    expect(chapterDownloadsRepo.deleteDownload).toHaveBeenCalledWith({
      chapterId: 'chapter-1',
      isDeletePermanent: false
    })
  })

  it('wraps and rethrows a filesystem failure without touching the database record', async () => {
    vi.mocked(chapterDownloadsRepo.getDownload).mockReturnValue(download())
    vi.mocked(secureFs.deleteDir).mockRejectedValue(new Error('EBUSY'))

    await expect(
      downloadService.deleteChapter({ chapterId: 'chapter-1', isDeletePermanent: true })
    ).rejects.toThrow(/failed to delete chapter files/i)
    expect(chapterDownloadsRepo.deleteDownload).not.toHaveBeenCalled()
  })
})

describe('deleteManga', () => {
  it('deletes every chapter and batches the successful ones into a single repo call', async () => {
    vi.mocked(chapterDownloadsRepo.filterDownloadsByMangaId).mockReturnValue([
      download({ chapterId: 'c1' }),
      download({ chapterId: 'c2' })
    ])

    const result = await downloadService.deleteManga('manga-1')

    expect(chapterDownloadsRepo.batchDeleteDownloads).toHaveBeenCalledWith([
      { chapterId: 'c1', isDeletePermanent: true },
      { chapterId: 'c2', isDeletePermanent: true }
    ])
    expect(result).toEqual({
      success: true,
      successfulCount: 2,
      failedCount: 0,
      failedChapters: []
    })
  })

  it('records a per-chapter failure without aborting the remaining deletions', async () => {
    vi.mocked(chapterDownloadsRepo.filterDownloadsByMangaId).mockReturnValue([
      download({ chapterId: 'c1' }),
      download({ chapterId: 'c2' })
    ])
    vi.mocked(secureFs.deleteDir)
      .mockRejectedValueOnce(new Error('EBUSY'))
      .mockResolvedValueOnce(undefined)

    const result = await downloadService.deleteManga('manga-1')

    expect(result).toEqual({
      success: false,
      successfulCount: 1,
      failedCount: 1,
      failedChapters: ['c1']
    })
    expect(chapterDownloadsRepo.batchDeleteDownloads).toHaveBeenCalledWith([
      { chapterId: 'c2', isDeletePermanent: true }
    ])
  })

  it('does not call batchDeleteDownloads when there is nothing to delete', async () => {
    vi.mocked(chapterDownloadsRepo.filterDownloadsByMangaId).mockReturnValue([])

    const result = await downloadService.deleteManga('manga-1')

    expect(chapterDownloadsRepo.batchDeleteDownloads).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
  })
})

describe('batchDeleteManga', () => {
  it('deletes each manga in turn', async () => {
    vi.mocked(chapterDownloadsRepo.filterDownloadsByMangaId).mockReturnValue([])

    await downloadService.batchDeleteManga(['manga-1', 'manga-2'])

    expect(chapterDownloadsRepo.filterDownloadsByMangaId).toHaveBeenNthCalledWith(1, 'manga-1')
    expect(chapterDownloadsRepo.filterDownloadsByMangaId).toHaveBeenNthCalledWith(2, 'manga-2')
  })
})

describe('clearCompletedDownloads', () => {
  it('soft-deletes only the completed downloads and returns how many were cleared', () => {
    vi.mocked(chapterDownloadsRepo.getAllDownloads).mockReturnValue([
      download({ chapterId: 'c1', status: DownloadStatus.Completed }),
      download({ chapterId: 'c2', status: DownloadStatus.Downloading })
    ])

    const result = downloadService.clearCompletedDownloads()

    expect(chapterDownloadsRepo.batchDeleteDownloads).toHaveBeenCalledWith([
      { chapterId: 'c1', isDeletePermanent: false }
    ])
    expect(result).toBe(1)
  })
})

describe('emptyDiskCache', () => {
  it('delegates to the disk cache util', async () => {
    await downloadService.emptyDiskCache()

    expect(diskCacheUtil.emptyDiskCoverCache).toHaveBeenCalled()
  })
})
