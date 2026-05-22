import { cleanupRepo } from '../../database/repositories/cleanup.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { settingsManager } from '../../settings/settings-manager'
import { isDownloadsSettings } from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrap-handler'

export function registerStorageHandlers(): void {
  /**
   * Get storage statistics for all manga data.
   *
   * Returns disk usage breakdown for manga metadata, covers, and downloaded chapters.
   * Used in Storage Management UI to show what's consuming space.
   *
   * @returns Promise<{totalSize: number, coverCacheSize: number, downloadedChaptersSize: number, mangaCount: number}> - Storage stats in bytes
   *
   * @example
   * // Display storage usage
   * const stats = await window.api.getStorageStats()
   * console.log(`Total: ${stats.totalSize / 1024 / 1024} MB`)
   * console.log(`${stats.mangaCount} manga in library`)
   */
  wrapIpcHandler('storage:get-stats', async () => {
    return mangaRepo.statsMangaTable()
  })

  /**
   * Clear manga metadata cache based on last access time.
   *
   * Deletes cached manga metadata (titles, descriptions, tags) that haven't been
   * accessed recently. Immediate mode deletes all non-favorited manga metadata.
   * Gentle mode (default) only deletes entries older than 90 days.
   *
   * @param immediate - If true, deletes all non-favorited manga immediately; if false, only deletes entries older than 90 days
   * @returns Promise<{deletedCount: number, freedSpace: number}> - Cleanup result summary
   * @throws {TypeError} - If immediate is not a boolean
   *
   * @example
   * // Gentle cleanup (90+ day old entries)
   * await window.api.clearMangaCache(false)
   *
   * @example
   * // Aggressive cleanup (all non-favorited)
   * await window.api.clearMangaCache(true)
   */
  wrapIpcHandler('storage:clear-manga-cache', async (_, immediate: unknown) => {
    if (typeof immediate !== 'boolean') {
      throw new TypeError('Invalid parameter for clearing manga cache')
    }

    return mangaRepo.cleanupMangaCache(immediate)
  })

  /**
   * Optimize database to reclaim wasted space.
   *
   * Runs VACUUM command on SQLite database to reclaim space from deleted records
   * and defragment the database file. May take a few seconds for large databases.
   * Should be run periodically after bulk deletions.
   *
   * @returns Promise<{freedSpace: number}> - Amount of space reclaimed in bytes
   *
   * @example
   * // Optimize database after bulk cleanup
   * const result = await window.api.optimiseStorage()
   * console.log(`Reclaimed ${result.freedSpace / 1024 / 1024} MB`)
   */
  wrapIpcHandler('storage:optimise-manga-cache', async () => {
    return await cleanupRepo.reclaimStorage()
  })

  /**
   * Set cover image cache size limit.
   *
   * Updates the maximum disk space for cached manga cover images. Accepts values
   * from 10 MB to 500 MB, or 0 for unlimited. When limit is exceeded, least recently
   * used covers are evicted. Changes take effect immediately.
   *
   * @param limit - Cache limit in megabytes (10-500, or 0 for unlimited)
   * @returns Promise<void>
   * @throws {TypeError} - If limit is not a number or is negative
   * @throws {RangeError} - If limit is not 0 and is outside 10-500 MB range
   *
   * @example
   * // Set 200 MB limit
   * await window.api.setCoverCacheLimit(200)
   *
   * @example
   * // Set unlimited (0)
   * await window.api.setCoverCacheLimit(0)
   */
  wrapIpcHandler('storage:set-cover-cache-limit', async (_, limit: unknown) => {
    if (typeof limit !== 'number' || limit < 0) {
      throw new TypeError('Invalid cover cache limit value')
    }

    // Make sure we only accept the value ranging from 10 MB to 500 MB (after converted to bytes) to prevent potential issues, 0 is accepted as it means "unlimited"
    const byteLimit = limit * 1024 * 1024
    if (byteLimit !== 0 && (byteLimit < 10 * 1024 * 1024 || byteLimit > 500 * 1024 * 1024)) {
      throw new RangeError('Cover cache limit must be between 10 MB and 500 MB')
    }

    // Use validated approach: load settings, update field, validate section, save
    const settings = await settingsManager.load()
    settings.downloads.maxDiskCacheSize = byteLimit

    if (!isDownloadsSettings(settings.downloads)) {
      throw new Error('Invalid downloads settings after updating cache limit')
    }

    settingsManager.save(settings)
  })
}
