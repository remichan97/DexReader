import { downloadService } from './../../services/download.service'
import { DownloadChapterOptions } from './../../services/options/download-chapter.option'
import { wrapIpcHandler } from '../wrap-handler'
import {
  isDownloadChapterOptions,
  isQueuedDownloads
} from '../../settings/validators/types.validator'
import { downloadQueueService } from '../../services/download-queue.service'
import { QueuedDownloads } from '../../services/types/downloads/queued-downloads.type'
import { mainLog } from '../../services/logging/main-logging.service'
import { DeleteChapterOptions } from '../../services/options/delete-chapter.option'

export function registerDownloadHandlers(): void {
  /**
   * Download a manga chapter for offline reading.
   *
   * Queues a chapter for download with specified language and image quality.
   * Download proceeds asynchronously in background. Progress events emitted via IPC.
   * Downloaded chapters are saved to user-configured downloads directory and accessible
   * via local-manga:// protocol.
   *
   * @param params - Download configuration object
   * @param params.chapterId - MangaDex chapter UUID
   * @param params.mangaId - MangaDex manga UUID (for organizing downloads by series)
   * @param params.language - Chapter language code (e.g., 'en', 'ja')
   * @param params.quality - Image quality: 'data' (original) or 'data-saver' (compressed ~60% size)
   * @returns Promise<void> - Resolves when download is queued (not completed)
   * @throws {TypeError} - If params object is invalid or missing required fields
   *
   * @example
   * // Download English chapter at original quality
   * await window.api.downloadChapter({
   *   chapterId: 'abc123-def456...',
   *   mangaId: 'xyz789-uvw012...',
   *   language: 'en',
   *   quality: 'data'
   * })
   */
  wrapIpcHandler('downloads:download-chapter', async (_, params: unknown) => {
    isDownloadChapterOptions(params)

    if (!isDownloadChapterOptions(params)) {
      mainLog.warn('[Downloads] Invalid download chapter options')
      throw new TypeError('Invalid parameters for downloading chapter')
    }

    const options: DownloadChapterOptions = {
      chapterId: params.chapterId,
      mangaId: params.mangaId,
      language: params.language,
      quality: params.quality
    }

    mainLog.info(`[Downloads] Chapter download requested: ${options.chapterId}`)
    return await downloadService.downloadChapter(options)
  })

  /**
   * Delete a downloaded chapter.
   *
   * Permanently deletes, or hides (soft delete), a downloaded chapter based on options. Permanent delete removes files from disk and database record. Soft delete keeps files but marks as hidden in database, effectively hides the chapter from the DownloadsView. Used in DownloadsView for managing downloaded chapters.
   *
   * @param options - Delete configuration object
   * @param options.chapterId - MangaDex chapter UUID
   * @param options.isDeletePermanent - Whether to permanently delete files (true) or just mark as deleted in database (false)
   * @returns Promise<void>
   * @throws {TypeError} - If options object is invalid or missing required fields
   *
   * @example
   * // Permanently delete a downloaded chapter
   * await window.api.deleteDownloadedChapter({ chapterId: 'abc123-def456...', isDeletePermanent: true })
   */
  wrapIpcHandler('downloads:delete-chapter', async (_, options: unknown) => {
    if (typeof options !== 'object' || options === null || !('chapterId' in options)) {
      throw new TypeError('Invalid options for deleting chapter')
    }

    const deleteOptions = options as DeleteChapterOptions

    mainLog.info(`[Downloads] Chapter deletion requested: ${deleteOptions.chapterId}`)
    return await downloadService.deleteChapter(deleteOptions)
  })

  /**
   * Get all downloaded chapters across all manga.
   *
   * Returns list of all chapters currently downloaded with metadata. Used in
   * DownloadsView to display active and completed downloads.
   *
   * @returns Promise<Array<{chapterId: string, mangaId: string, status: string, progress: number, ...}>> - All downloads with status and progress
   *
   * @example
   * // Get all downloads for display
   * const downloads = await window.api.getAllDownloads()
   * downloads.forEach(d => console.log(`${d.mangaId}: ${d.status} ${d.progress}%`))\n   */
  wrapIpcHandler('download:get-all-downloads', async () => {
    return downloadService.getAllDownloads()
  })

  /**
   * Clear completed downloads from the database.
   *
   * Removes download records with status 'completed' from chapter_downloads table.
   * Downloaded files remain on disk. Used to clean up completed entries from DownloadsView.
   *
   * @returns Promise<void>
   *
   * @example
   * // Clear completed downloads list
   * await window.api.clearCompletedDownloads()
   */
  wrapIpcHandler('download:clear-completed', async () => {
    mainLog.info('[Downloads] Clear completed downloads requested')
    return downloadService.clearCompletedDownloads()
  })

  /**
   * Check if a specific chapter is downloaded.
   *
   * Returns download status and metadata for a chapter. Null if not downloaded.
   *
   * @param chapterId - MangaDex chapter UUID
   * @returns Promise<{downloaded: boolean, quality: string, ...} | null> - Download info or null
   * @throws {TypeError} - If chapterId is not a string
   *
   * @example
   * // Check if chapter is downloaded
   * const download = await window.api.getDownload('abc123...')
   * if (download) {
   *   console.log(`Downloaded at ${download.quality} quality`)
   * }
   */
  wrapIpcHandler('download:get-download', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for getting download')
    }

    return downloadService.isDownloaded(chapterId)
  })

  /**
   * Check if a chapter is downloaded (boolean).
   *
   * Simple boolean check for download status. Used in ChapterList to show download badges.
   *
   * @param chapterId - MangaDex chapter UUID
   * @returns Promise<boolean> - True if downloaded, false otherwise
   * @throws {TypeError} - If chapterId is not a string
   *
   * @example
   * // Show download badge
   * const isDownloaded = await window.api.isDownloaded('abc123...')
   * if (isDownloaded) showBadge()
   */
  wrapIpcHandler('download:is-downloaded', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for checking download')
    }

    return downloadService.isDownloaded(chapterId)
  })

  /**
   * Get storage statistics for all downloads.
   *
   * Returns total disk space used by downloaded manga chapters and breakdown by manga.
   * Used in Storage Management UI.
   *
   * @returns Promise<{totalSize: number, mangaBreakdown: Array<{mangaId: string, size: number}>}> - Storage info in bytes
   *
   * @example
   * // Display download storage usage
   * const stats = await window.api.getDownloadStorageStats()
   * console.log(`Total: ${stats.totalSize / 1024 / 1024} MB`)
   */
  wrapIpcHandler('download:storage-stats', async () => {
    return downloadService.getStorageInfo()
  })

  /**
   * Delete all downloaded chapters for a manga.
   *
   * Permanently removes all chapter downloads for a specific manga. Frees disk space.
   * Cannot be undone. Useful when removing manga from library.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<{deletedCount: number, freedSpace: number}> - Deletion result
   * @throws {TypeError} - If mangaId is invalid or empty
   *
   * @example
   * // Delete all chapters for manga
   * const result = await window.api.deleteMangaDownloads('xyz789...')
   * console.log(`Deleted ${result.deletedCount} chapters, freed ${result.freedSpace} bytes`)
   */
  wrapIpcHandler('download:delete-manga', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for deleting manga downloads')
    }

    if (!mangaId) {
      throw new TypeError('MangaId is required for deleting manga downloads')
    }

    mainLog.info(`[Downloads] Manga deletion requested: ${mangaId}`)
    return await downloadService.deleteManga(mangaId)
  })

  /**
   * Delete downloaded chapters for multiple manga (batch operation).
   *
   * Permanently removes all downloads for specified manga IDs. Batch version of
   * delete-manga for bulk cleanup operations.
   *
   * @param mangaIds - Array of MangaDex manga UUIDs
   * @returns Promise<{deletedCount: number, freedSpace: number}> - Batch deletion result
   * @throws {TypeError} - If mangaIds is not an array of strings or is empty
   *
   * @example
   * // Bulk delete downloads
   * const result = await window.api.batchDeleteMangaDownloads(['id1...', 'id2...'])
   * console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)
   */
  wrapIpcHandler('download:batch-delete-manga', async (_, mangaIds: unknown) => {
    if (!Array.isArray(mangaIds) || mangaIds.some((id) => typeof id !== 'string')) {
      throw new TypeError('Invalid mangaIds for batch deleting manga downloads')
    }

    mainLog.info(`[Downloads] Batch manga deletion requested: ${mangaIds.length} manga`)

    if (mangaIds.length === 0) {
      throw new TypeError('At least one mangaId is required for batch deleting manga downloads')
    }

    return await downloadService.batchDeleteManga(mangaIds)
  })

  /**
   * Add a chapter to the download queue.
   *
   * Adds chapter to download queue with metadata. Download begins automatically
   * when queue slot is available (based on concurrent download limit in settings).
   * Progress events emitted via download:progress IPC channel.
   *
   * @param params - Queue entry object
   * @param params.chapterId - MangaDex chapter UUID
   * @param params.mangaId - MangaDex manga UUID
   * @param params.language - Chapter language code
   * @param params.quality - Image quality: 'data' or 'data-saver'
   * @param params.addedAt - Timestamp when added to queue (for FIFO ordering)
   * @returns Promise<void>
   * @throws {TypeError} - If params object is invalid
   *
   * @example
   * // Add chapter to download queue
   * await window.api.addToDownloadQueue({
   *   chapterId: 'abc123...',
   *   mangaId: 'xyz789...',
   *   language: 'en',
   *   quality: 'data',
   *   addedAt: Date.now()
   * })
   */
  wrapIpcHandler('download:add-to-queue', async (_, params: unknown) => {
    isQueuedDownloads(params)

    if (!isQueuedDownloads(params)) {
      throw new TypeError('Invalid parameters for adding chapter to download queue')
    }

    const options: QueuedDownloads = {
      chapterId: params.chapterId,
      mangaId: params.mangaId,
      language: params.language,
      quality: params.quality,
      addedAt: params.addedAt
    }

    return downloadQueueService.addToQueue(options)
  })

  /**
   * Clear cover image cache.
   *
   * Deletes all cached manga cover images from disk. Frees space but covers will
   * need to be re-downloaded on next view. Obeys cover cache limit settings.
   *
   * @returns Promise<{freedSpace: number}> - Amount of space freed in bytes
   *
   * @example
   * // Clear cover cache
   * const result = await window.api.clearCoverCache()
   * console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)
   */
  wrapIpcHandler('download:clear-cover-cache', async () => {
    return await downloadService.emptyDiskCache()
  })

  /**
   * Add multiple chapters to download queue (batch operation).
   *
   * Batch version of add-to-queue for bulk downloads. Chapters added in array order
   * and downloaded sequentially based on queue FIFO.
   *
   * @param params - Array of queue entry objects (same structure as add-to-queue)
   * @returns Promise<void>
   * @throws {TypeError} - If params is not an array or any entry is invalid
   *
   * @example
   * // Queue multiple chapters for download
   * await window.api.addBatchToDownloadQueue([
   *   {chapterId: 'ch1...', mangaId: 'mg1...', language: 'en', quality: 'data', addedAt: Date.now()},
   *   {chapterId: 'ch2...', mangaId: 'mg1...', language: 'en', quality: 'data', addedAt: Date.now()}
   * ])
   */
  wrapIpcHandler('download:add-batch-to-queue', async (_, params: unknown) => {
    if (!Array.isArray(params)) {
      throw new TypeError('Invalid parameters for adding batch of chapters to download queue')
    }

    const options: QueuedDownloads[] = params.map((param) => {
      if (!isQueuedDownloads(param)) {
        throw new TypeError('Invalid parameters for adding chapter to download queue')
      }

      return {
        chapterId: param.chapterId,
        mangaId: param.mangaId,
        language: param.language,
        quality: param.quality,
        addedAt: param.addedAt
      }
    })

    return downloadQueueService.addBatchToQueue(options)
  })

  /**
   * Remove a chapter from the download queue.
   *
   * Removes queued or in-progress download. If download is active, it's cancelled.
   * Completed downloads cannot be removed via this handler (use delete-chapter instead).
   *
   * @param chapterId - MangaDex chapter UUID
   * @returns Promise<void>
   * @throws {TypeError} - If chapterId is not a string
   *
   * @example
   * // Cancel queued download
   * await window.api.removeFromDownloadQueue('abc123...')
   */
  wrapIpcHandler('download:remove-from-queue', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for removing chapter from download queue')
    }

    return downloadQueueService.removeFromQueue(chapterId)
  })

  /**
   * Clear all chapters from download queue.
   *
   * Removes all queued downloads (pending only, not active or completed).
   * Active downloads continue running. Used to reset queue.
   *
   * @returns Promise<void>
   *
   * @example
   * // Clear pending queue
   * await window.api.clearDownloadQueue()
   */
  wrapIpcHandler('download:clear-queue', async () => {
    return downloadQueueService.clearQueue()
  })

  /**
   * Cancel all queued and in-progress downloads.
   *
   * Stops all active downloads and clears queue. More aggressive than clear-queue.
   * Completed downloads remain. Used for emergency stop.
   *
   * @returns Promise<void>
   *
   * @example
   * // Emergency stop all downloads
   * await window.api.cancelAllQueuedDownloads()
   */
  wrapIpcHandler('download:cancel-all-queued', async () => {
    return downloadQueueService.cancelAllQueued()
  })

  /**
   * Retry a failed download.
   *
   * Re-queues a chapter that failed to download. Resets error state and attempts
   * download again from beginning. Chapter moves to end of queue.
   *
   * @param chapterId - MangaDex chapter UUID
   * @returns Promise<void>
   * @throws {TypeError} - If chapterId is not a string
   *
   * @example
   * // Retry failed download
   * await window.api.retryDownload('abc123...')
   */
  wrapIpcHandler('download:retry', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for retrying download')
    }

    return downloadQueueService.retryDownload(chapterId)
  })

  /**
   * Get download queue statistics.
   *
   * Returns counts of downloads by status (pending, active, completed, failed).
   * Used in DownloadsView header to show queue summary.
   *
   * @returns Promise<{pending: number, active: number, completed: number, failed: number}> - Queue stats
   *
   * @example
   * // Show queue stats
   * const stats = await window.api.getQueueStats()
   * console.log(`${stats.active} active, ${stats.pending} pending`)
   */
  wrapIpcHandler('download:get-queue-stats', async () => {
    return downloadQueueService.getQueueStats()
  })

  /**
   * Get all queued download items.
   *
   * Returns full list of download queue entries with metadata and status.
   * Used to populate DownloadsView list.
   *
   * @returns Promise<Array<{chapterId: string, status: string, progress: number, ...}>> - Queue items
   *
   * @example
   * // Get queue for display
   * const items = await window.api.getQueuedDownloadItems()
   * items.forEach(item => console.log(`${item.chapterId}: ${item.status}`))
   */
  wrapIpcHandler('download:get-queued-items', async () => {
    return downloadQueueService.getQueuedItems()
  })

  /**
   * Get download statistics for a specific manga.
   *
   * Returns download counts (total chapters, downloaded, in-progress) for a manga.
   * Used in MangaDetails to show download status summary.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<{totalChapters: number, downloaded: number, inProgress: number}> - Download stats
   * @throws {TypeError} - If mangaId is not a string
   *
   * @example
   * // Show manga download stats
   * const stats = await window.api.getDownloadStats('xyz789...')
   * console.log(`${stats.downloaded}/${stats.totalChapters} chapters downloaded`)
   */
  wrapIpcHandler('download:get-download-stats', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for getting download stats')
    }

    return downloadService.getDownloadStats(mangaId)
  })
}
