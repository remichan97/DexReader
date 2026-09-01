import { wrapIpcHandler } from '../wrap-handler'
import { isQueuedDownloads } from '../../settings/validators/types.validator'
import { downloadQueueService } from '../../services/download-queue.service'
import { QueuedDownloads } from '@shared/types/downloads/queued-downloads.type'

export function registerDownloadQueueHandlers(): void {
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
}
