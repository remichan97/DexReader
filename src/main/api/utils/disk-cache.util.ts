import path from 'node:path'
import { getCachedCoverPath } from '../../filesystem/pathValidator'
import { secureFs } from '../../filesystem/secureFs'
import { getSettingByPath } from '../../settings/settingsManager'
import { mangaRepository } from '../../database/repository/manga.repo'

export class DiskCacheUtil {
  private readonly coverCachePath = getCachedCoverPath()

  async initCachePath(): Promise<void> {
    try {
      await secureFs.ensureDir(this.coverCachePath)
      console.log('[DiskCache] Cache path initialized:', this.coverCachePath)
    } catch (error) {
      console.error('[DiskCache] Failed to initialize cache path:', this.coverCachePath, error)
    }
  }

  async loadCoverFromDisk(url: string): Promise<Buffer | undefined> {
    try {
      const filePath = this.getCoverFilePath(url)
      if (!(await secureFs.isExists(filePath))) {
        return undefined
      }

      const data = await secureFs.readFile(filePath)
      console.log('[DiskCache] Loaded cover from disk:', url)
      return Buffer.isBuffer(data) ? data : Buffer.from(data)
    } catch (error) {
      console.error('[DiskCache] Failed to load cover from disk:', url, error)
      return undefined
    }
  }

  async saveCoverToDisk(url: string, data: Buffer): Promise<void> {
    try {
      const filePath = this.getCoverFilePath(url)

      // Before saving, enforce cache size limit to prevent uncontrolled growth
      await this.enforceDiskCacheLimit()

      // Ensure the directory exists before writing
      await secureFs.ensureDir(path.dirname(filePath))

      await secureFs.writeFile(filePath, data)

      // Update the manga's cached cover date in the database
      const mangaId = this.extractMangaIdFromCoverUrl(url) // Extract mangaId from URL
      if (mangaId) {
        mangaRepository.updateCoverCachedDate([mangaId])
      }

      console.log('[DiskCache] Saved cover to disk:', url)
    } catch (error) {
      console.error('[DiskCache] Failed to save cover to disk:', url, error)
    }
  }

  async emptyDiskCoverCache(): Promise<void> {
    try {
      const files = await secureFs.readDir(this.coverCachePath)

      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.coverCachePath, file)
          await secureFs.deleteFile(filePath)
        })
      )

      mangaRepository.clearCachedCoverDate() // Clear cached cover dates for all manga

      console.log('[DiskCache] Emptied disk cover cache successfully.')
    } catch (error) {
      console.error('[DiskCache] Failed to empty disk cover cache:', error)
    }
  }

  // Private method for generating a safe file path for a given URL
  private getCoverFilePath(url: string): string {
    // URL Format: https://uploads.mangadex.org/covers/{mangaId}/{filename}.{size}.{fileExtension}
    // We're looking to extract the into {mangaId}/{filename}.{size}.{fileExtension}
    const urlObj = new URL(url)
    const parts = urlObj.pathname.split('/')
    const mangaId = parts[2] // covers/{mangaId}/...
    const filename = parts.slice(3).join('/') // {filename}.{size}.{fileExtension}

    // Sanitize mangaId and filename to prevent path traversal
    const safeMangaId = mangaId.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
    const safeFilename = filename.replaceAll(/[^a-zA-Z0-9._-]/g, '_')

    return path.join(this.coverCachePath, safeMangaId, safeFilename)
  }

  // Assert whether the cache size exceeds the limit and evict old files if necessary
  private async enforceDiskCacheLimit(): Promise<void> {
    try {
      const maxCacheSize = await this.getMaxCacheSize()
      const mangaIdToBeEvicted: string[] = []

      const files = await secureFs.readDir(this.coverCachePath)

      // Get file stats and calculate total cache size
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.coverCachePath, file)
          const stats = await secureFs.stat(filePath)
          return { filePath, size: stats.size, mtime: stats.mtime }
        })
      )

      const totalSize = fileStats.reduce((sum, { size }) => sum + size, 0)

      // We're still within the limit, no eviction needed
      if (totalSize < maxCacheSize) {
        return
      }

      // Evict oldest caches until we're under the limit
      const sortedFiles = fileStats.toSorted((a, b) => a.mtime.getTime() - b.mtime.getTime())

      let currentSize = totalSize
      for (const { filePath, size } of sortedFiles) {
        // Leave at least 10% of the cache size free to prevent aggressive eviction
        if (currentSize - size < maxCacheSize * 0.9) {
          break
        }

        await secureFs.deleteFile(filePath)
        currentSize -= size

        if (currentSize < maxCacheSize) {
          break
        }

        // Mark to database that this cache has been evicted
        const mangaId = filePath.split(path.sep).at(-2) // Extract mangaId from path
        if (mangaId) {
          mangaIdToBeEvicted.push(mangaId)
        }
      }

      mangaRepository.clearCachedCoverDate(mangaIdToBeEvicted)

      console.log('[DiskCache] Enforced disk cache limit. Current size:', currentSize)
    } catch (error) {
      console.error('[DiskCache] Failed to enforce disk cache limit:', error)
    }
  }

  private async getMaxCacheSize(): Promise<number> {
    return ((await getSettingByPath('downloads', 'maxDiskCacheSize')) as number) ?? 50 * 1024 * 1024 // Default to 50 MB if not set
  }

  private extractMangaIdFromCoverUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url)
      const parts = urlObj.pathname.split('/')
      return parts[2] // covers/{mangaId}/...
    } catch {
      return undefined
    }
  }
}
export const diskCacheUtil = new DiskCacheUtil()
