import type { Stats } from 'node:fs'

vi.mock('../../filesystem/path-validator', () => ({
  getCachedCoverPath: vi.fn(() => '/mock/appdata/covers')
}))

vi.mock('../../filesystem/secure-fs', () => ({
  secureFs: {
    ensureDir: vi.fn(),
    readDir: vi.fn(),
    stat: vi.fn(),
    isExists: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteDir: vi.fn(),
    deleteFile: vi.fn()
  }
}))

vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: { updateCoverCachedDate: vi.fn(), clearCachedCoverDate: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../settings/settings-manager', () => ({
  settingsManager: { getByPath: vi.fn() }
}))

import { diskCacheUtil } from './disk-cache.util'
import { secureFs } from '../../filesystem/secure-fs'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { settingsManager } from '../../settings/settings-manager'
import path from 'node:path'

const COVER_URL = 'https://uploads.mangadex.org/covers/manga-1/cover.jpg.512.jpg'
const COVER_FILE_PATH = path.join('/mock/appdata/covers', 'manga-1', 'cover.jpg.512.jpg')

function mockStats(overrides: Partial<Stats> = {}): Stats {
  return {
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
    mtime: new Date(0),
    ...overrides
  } as Stats
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(settingsManager.getByPath).mockReturnValue(50 * 1024 * 1024)
  vi.mocked(secureFs.readDir).mockResolvedValue([])
  vi.mocked(secureFs.writeFile).mockResolvedValue(undefined)
  vi.mocked(secureFs.ensureDir).mockResolvedValue(undefined)
})

describe('initCachePath', () => {
  it('ensures the cover cache directory exists', async () => {
    await diskCacheUtil.initCachePath()

    expect(secureFs.ensureDir).toHaveBeenCalledWith('/mock/appdata/covers')
  })

  it('swallows an error from ensureDir rather than throwing', async () => {
    vi.mocked(secureFs.ensureDir).mockRejectedValue(new Error('disk full'))

    await expect(diskCacheUtil.initCachePath()).resolves.toBeUndefined()
  })
})

describe('getDiskCacheSize', () => {
  it('sums the size of top-level files only when there are no subdirectories', async () => {
    vi.mocked(secureFs.readDir).mockResolvedValue(['a.jpg', 'b.jpg'])
    vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ size: 100 }))

    const result = await diskCacheUtil.getDiskCacheSize()

    expect(result).toEqual({ cacheSize: 200, fileCount: 2 })
  })

  it('recurses one level into subdirectories and includes their files', async () => {
    vi.mocked(secureFs.readDir).mockImplementation(async (dirPath: string) =>
      dirPath === '/mock/appdata/covers' ? ['manga-1'] : ['cover.jpg']
    )
    vi.mocked(secureFs.stat).mockImplementation(async (filePath: string) =>
      mockStats({
        isFile: () => !filePath.endsWith('manga-1'),
        isDirectory: () => filePath.endsWith('manga-1'),
        size: 300
      })
    )

    const result = await diskCacheUtil.getDiskCacheSize()

    expect(result).toEqual({ cacheSize: 300, fileCount: 1 })
  })
})

describe('loadCoverFromDisk', () => {
  it('returns undefined when the cover file does not exist on disk', async () => {
    vi.mocked(secureFs.isExists).mockResolvedValue(false)

    const result = await diskCacheUtil.loadCoverFromDisk(COVER_URL)

    expect(result).toBeUndefined()
    expect(secureFs.readFile).not.toHaveBeenCalled()
  })

  it('reads the cover from the sanitized mangaId/filename path and returns it as a Buffer', async () => {
    vi.mocked(secureFs.isExists).mockResolvedValue(true)
    vi.mocked(secureFs.readFile).mockResolvedValue(Buffer.from([1, 2, 3]))

    const result = await diskCacheUtil.loadCoverFromDisk(COVER_URL)

    expect(secureFs.readFile).toHaveBeenCalledWith(COVER_FILE_PATH)
    expect(result).toEqual(Buffer.from([1, 2, 3]))
  })

  it('converts a string read result into a Buffer', async () => {
    vi.mocked(secureFs.isExists).mockResolvedValue(true)
    vi.mocked(secureFs.readFile).mockResolvedValue('raw-bytes')

    const result = await diskCacheUtil.loadCoverFromDisk(COVER_URL)

    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('returns undefined when reading the file throws', async () => {
    vi.mocked(secureFs.isExists).mockResolvedValue(true)
    vi.mocked(secureFs.readFile).mockRejectedValue(new Error('ENOENT'))

    const result = await diskCacheUtil.loadCoverFromDisk(COVER_URL)

    expect(result).toBeUndefined()
  })

  it('sanitizes unsafe characters out of the mangaId and filename segments', async () => {
    vi.mocked(secureFs.isExists).mockResolvedValue(true)
    vi.mocked(secureFs.readFile).mockResolvedValue(Buffer.from([1]))

    // The URL constructor percent-encodes the space before the pathname is split, so the
    // sanitizer sees "manga%201" / "cover%20name!.jpg" - the "%" and "!" are what it strips.
    await diskCacheUtil.loadCoverFromDisk(
      'https://uploads.mangadex.org/covers/manga 1/cover name!.jpg'
    )

    expect(secureFs.readFile).toHaveBeenCalledWith(
      path.join('/mock/appdata/covers', 'manga_201', 'cover_20name_.jpg')
    )
  })
})

describe('saveCoverToDisk', () => {
  it('writes the cover to the sanitized path and records the cached date for the manga', async () => {
    await diskCacheUtil.saveCoverToDisk(COVER_URL, Buffer.from([1, 2, 3]))

    expect(secureFs.writeFile).toHaveBeenCalledWith(COVER_FILE_PATH, Buffer.from([1, 2, 3]))
    expect(mangaRepo.updateCoverCachedDate).toHaveBeenCalledWith(['manga-1'])
  })

  it('does not write anything when the URL cannot be parsed', async () => {
    await diskCacheUtil.saveCoverToDisk('not-a-url', Buffer.from([1]))

    expect(secureFs.writeFile).not.toHaveBeenCalled()
    expect(mangaRepo.updateCoverCachedDate).not.toHaveBeenCalled()
  })

  it('skips eviction entirely when the configured cache limit is 0 (unlimited)', async () => {
    vi.mocked(settingsManager.getByPath).mockReturnValue(0)

    await diskCacheUtil.saveCoverToDisk(COVER_URL, Buffer.from([1]))

    expect(secureFs.readDir).not.toHaveBeenCalled()
    expect(secureFs.writeFile).toHaveBeenCalled()
  })

  it('falls back to a 50MB default limit when none is configured', async () => {
    vi.mocked(settingsManager.getByPath).mockReturnValue(undefined)
    vi.mocked(secureFs.readDir).mockResolvedValue(['a.jpg'])
    vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ size: 10 }))

    await diskCacheUtil.saveCoverToDisk(COVER_URL, Buffer.from([1]))

    // Well under the 50MB default, so no eviction should be triggered.
    expect(secureFs.deleteFile).not.toHaveBeenCalled()
  })

  it('does not evict anything while the cache is under the configured limit', async () => {
    vi.mocked(settingsManager.getByPath).mockReturnValue(1000)
    vi.mocked(secureFs.readDir).mockResolvedValue(['a.jpg'])
    vi.mocked(secureFs.stat).mockResolvedValue(mockStats({ size: 10 }))

    await diskCacheUtil.saveCoverToDisk(COVER_URL, Buffer.from([1]))

    expect(secureFs.deleteFile).not.toHaveBeenCalled()
  })

  it('evicts the oldest files first once the cache is at or over the configured limit', async () => {
    vi.mocked(settingsManager.getByPath).mockReturnValue(1000)
    vi.mocked(secureFs.readDir).mockResolvedValue(['manga-old/cover.jpg', 'manga-new/cover.jpg'])
    vi.mocked(secureFs.stat).mockImplementation(async (filePath: string) =>
      mockStats({
        size: filePath.includes('manga-old') ? 50 : 1000,
        mtime: filePath.includes('manga-old') ? new Date(1000) : new Date(2000)
      })
    )

    await diskCacheUtil.saveCoverToDisk(COVER_URL, Buffer.from([1]))

    expect(secureFs.deleteFile).toHaveBeenCalledWith(
      path.join('/mock/appdata/covers', 'manga-old/cover.jpg')
    )
    expect(secureFs.deleteFile).not.toHaveBeenCalledWith(
      path.join('/mock/appdata/covers', 'manga-new/cover.jpg')
    )
    expect(mangaRepo.clearCachedCoverDate).toHaveBeenCalledWith(['manga-old'])
  })
})

describe('emptyDiskCoverCache', () => {
  it('deletes top-level files directly and directories recursively, then clears all cached dates', async () => {
    vi.mocked(secureFs.readDir).mockResolvedValue(['loose-file.jpg', 'manga-1'])
    vi.mocked(secureFs.stat).mockImplementation(async (filePath: string) =>
      mockStats({
        isFile: () => !filePath.endsWith('manga-1'),
        isDirectory: () => filePath.endsWith('manga-1')
      })
    )

    await diskCacheUtil.emptyDiskCoverCache()

    expect(secureFs.deleteFile).toHaveBeenCalledWith(
      path.join('/mock/appdata/covers', 'loose-file.jpg')
    )
    expect(secureFs.deleteDir).toHaveBeenCalledWith(path.join('/mock/appdata/covers', 'manga-1'))
    expect(mangaRepo.clearCachedCoverDate).toHaveBeenCalledWith()
  })

  it('swallows an error from readDir rather than throwing', async () => {
    vi.mocked(secureFs.readDir).mockRejectedValue(new Error('ENOENT'))

    await expect(diskCacheUtil.emptyDiskCoverCache()).resolves.toBeUndefined()
    expect(mangaRepo.clearCachedCoverDate).not.toHaveBeenCalled()
  })
})
