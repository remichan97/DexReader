import { cleanupRepo } from '../../database/repositories/cleanup.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
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
}
