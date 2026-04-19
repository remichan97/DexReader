import { BrowserWindow } from 'electron'
import { DownloadStatus } from '../database/enums/download-status.enum'
import { chapterDownloadsRepo } from '../database/repositories/chapter-downloads.repo'
import { downloadService } from './download.service'
import { DownloadChapterOptions } from './options/download-chapter.option'
import { DownloadChapterResult } from './results/dexreader/download-chapter.result'
import { QueueState } from './types/downloads/queue-state.type'
import { QueuedDownloads } from './types/downloads/queued-downloads.type'
import { getSettingByPath } from '../settings/settings-manager'
import {
  calculateAggregateStats,
  emitOverallProgressEvent,
  emitPermanentFailureNotification,
  getRetryDelay
} from './helpers/download-queue.helper'
import { MarkDownloadStateCommand } from '../database/commands/chapter-downloads/mark-state.command'
import {
  classifyDownloadError,
  ErrorClassification,
  getErrorSummary
} from './errors/download-error-classifier'
import { DownloadErrorCategory } from './errors/enums/download-error.enum'
import { ChapterDownloadQuery } from '../database/queries/chapter-downloads/chapter-downloads.query'
import { mainLog } from './logging/main-logging.service'

export class DownloadQueueService {
  // Main states
  private queue: QueuedDownloads[] = []
  private pendingUpdates: MarkDownloadStateCommand[] = []
  private readonly activeDownloads: Map<string, Promise<DownloadChapterResult>> = new Map()
  private readonly retryCount: Map<string, number> = new Map()
  private batchUpdateTimeout: NodeJS.Timeout | undefined = undefined

  // Progress throttling
  private lastEmit = Date.now()
  private readonly emitInterval = 100 // At most 10 updates per second

  // Progress caching - cache getAllDownloads() results for 1 second to reduce DB load
  private cachedDownloadStats: ChapterDownloadQuery[] | null = null
  private lastCacheUpdate = 0
  private readonly cacheValidityMs = 1000 // 1 second cache

  // Other fixed numerical values
  private readonly maxRetryAttempts = 3
  private readonly retryDelays = [5000, 15000, 45000] // in milliseconds, for each retry attempt

  // Add a download to the queue
  addToQueue(item: QueuedDownloads): void {
    // is the item in the queue already?
    const existingIndex = this.queue.findIndex(
      (queuedItem) => queuedItem.chapterId === item.chapterId
    )

    if (existingIndex !== -1) {
      // If it exists, do nothing
      return
    }

    // Check if already downloaded
    const existingDownload = chapterDownloadsRepo.getDownload(item.chapterId)

    if (existingDownload?.status === DownloadStatus.Completed) {
      // Already downloaded, don't queue again
      return
    }

    this.queue.push(item)
    this.processQueue()
  }

  // Get current queue items for UI display
  // This is a snapshot of the queue that is being shown to the UI, not the active downloads which are tracked separately
  // This is for the UI to respond to user actions like "Download All" and prove that the chapters have been added to the queue, even if they haven't started downloading yet
  getQueuedItems(): QueuedDownloads[] {
    return [...this.queue]
  }

  // Resume any incomplete downloads
  resumeIncompleteDownloads(): void {
    mainLog.info('[DownloadQueue] Looking for incomplete downloads to resume...')

    const allDownloads = chapterDownloadsRepo.getAllDownloads()
    const incompletedDownloads = allDownloads.filter(
      (d) => d.status === DownloadStatus.Downloading || d.status === DownloadStatus.Queued
    )

    if (incompletedDownloads.length === 0) {
      mainLog.info('[DownloadQueue] No incompleted downloads found.')
      return
    }

    mainLog.info(
      `[DownloadQueue] Found ${incompletedDownloads.length} incompleted downloads. Resuming...`
    )

    const itemsToResume: QueuedDownloads[] = incompletedDownloads.map((d) => ({
      chapterId: d.chapterId,
      mangaId: d.mangaId,
      quality: d.imageQuality,
      language: d.language || 'en',
      addedAt: new Date() // We can set the addedAt to now since we're resuming them, not adding them for the first time
    }))

    this.addBatchToQueue(itemsToResume)
    this.processQueue()
  }

  // Add multiple downloads to the queue
  // Use when we're downloading a whole manga and want to add all chapters at once
  addBatchToQueue(items: QueuedDownloads[]): void {
    items.forEach((item) => this.addToQueue(item))
  }

  // Clear all queued items, but leave active downloads running
  clearQueue(): void {
    this.queue = []
  }

  // Cancel all queued downloads (not active ones)
  cancelAllQueued(): number {
    // Get count before clearing
    const queuedCount = this.queue.length

    // Clear the queue
    this.queue = []

    mainLog.info(`[DownloadQueue] Cancelled ${queuedCount} queued downloads`)

    return queuedCount
  }

  // Remove a specific chapter from the queue
  removeFromQueue(chapterId: string): boolean {
    // Make sure we actually have the chapter in the queue before trying to remove it
    const index = this.queue.findIndex((item) => item.chapterId === chapterId)

    if (index === -1) {
      return false
    }

    this.queue.splice(index, 1)

    return true
  }

  // Retry a failed download by chapterId
  retryDownload(chapterId: string): void {
    // Reset retry count for this chapter
    this.retryCount.delete(chapterId)

    // Query the database for the download data
    const downloadData = chapterDownloadsRepo.getDownload(chapterId)

    if (downloadData?.status !== DownloadStatus.Failed) {
      mainLog.warn(
        `[DownloadQueue] Can't retry an unknown or non-failed download with chapterId ${chapterId}`
      )
      return
    }

    // Queue the download again with the same parameters as before
    const item: QueuedDownloads = {
      chapterId: downloadData.chapterId,
      mangaId: downloadData.mangaId,
      quality: downloadData.imageQuality,
      language: downloadData.language || 'en',
      addedAt: new Date()
    }

    this.addToQueue(item)
  }

  // Get the download stats
  getQueueStats(): QueueState {
    const completedDownload = chapterDownloadsRepo.countDownloadsByStatus(DownloadStatus.Completed)

    const failedDownloads = chapterDownloadsRepo.countDownloadsByStatus(DownloadStatus.Failed)

    return {
      items: [...this.queue],
      totalItems: this.queue.length,
      activeCounts: this.activeDownloads.size,
      completedCounts: completedDownload,
      failedCounts: failedDownloads
    }
  }

  // Process the queue and start downloads if we have available slots
  private async processQueue(): Promise<void> {
    // Check if we have any available slots
    const concurrentLimit = await this.getConcurrentDownloadsSize()
    const availableSlots = concurrentLimit - this.activeDownloads.size

    if (availableSlots <= 0) {
      // No available slots, wait for an active download to finish
      return
    }

    // Do we have anything in queue?
    if (this.queue.length === 0) {
      return
    }

    // Start downloads for as many items as we have available slots
    const itemsToStart = this.queue.splice(0, availableSlots)

    for (const item of itemsToStart) {
      this.startDownload(item)
    }
  }

  // The actual download logic for a single chapter, with error handling and retry logic
  private async startDownload(item: QueuedDownloads): Promise<void> {
    const downloadOptions: DownloadChapterOptions = {
      chapterId: item.chapterId,
      quality: item.quality,
      language: item.language,
      mangaId: item.mangaId
    }

    const promise = downloadService.downloadChapter(downloadOptions)

    this.activeDownloads.set(item.chapterId, promise)

    try {
      await promise
      this.handleDownloadCompleted(item.chapterId)
    } catch (error) {
      this.handleDownloadFailure(item.chapterId, error)
    } finally {
      // Whatever happens, remove the download from the active list, then proceed to the next item in the queue
      this.activeDownloads.delete(item.chapterId)
      this.processQueue()
    }
  }

  private handleDownloadCompleted(chapterId: string): void {
    mainLog.info(`[DownloadQueue] Download completed for chapter ${chapterId}`)
    this.retryCount.delete(chapterId)
    this.emitOverallProgress()
  }

  private handleDownloadFailure(chapterId: string, error: unknown): void {
    // Classify the error to determine retry behavior
    const classification = classifyDownloadError(error)

    mainLog.error(
      `[DownloadQueue] Download failed for chapter ${chapterId}:`,
      getErrorSummary(error)
    )

    // Check if error is retryable
    if (!classification.isRetryable) {
      mainLog.warn(
        `[DownloadQueue] Permanent error for chapter ${chapterId}, not retrying: ${classification.userMessage}`
      )

      // Mark as permanently failed with user-friendly message
      this.scheduleBatchUpdate({
        chapterId,
        isFailed: true,
        errorMessage: classification.userMessage,
        storageSize: 0,
        totalPages: 0
      })

      // Cleanup retry counter
      this.retryCount.delete(chapterId)

      // Notify user with actionable message
      emitPermanentFailureNotification(chapterId, classification.userMessage)

      return // Don't schedule retry
    }

    // Error is retryable - proceed with retry logic
    const attempts = (this.retryCount.get(chapterId) || 0) + 1
    this.retryCount.set(chapterId, attempts)

    if (attempts >= this.maxRetryAttempts) {
      mainLog.error(
        `[DownloadQueue] Max retry attempts (${this.maxRetryAttempts}) exceeded for chapter ${chapterId}`
      )

      this.scheduleBatchUpdate({
        chapterId,
        isFailed: true,
        errorMessage: `Failed after ${attempts} attempts: ${classification.userMessage}`,
        storageSize: 0,
        totalPages: 0
      })

      this.retryCount.delete(chapterId)
      emitPermanentFailureNotification(chapterId, classification.userMessage)

      return
    }

    mainLog.info(
      `[DownloadQueue] Scheduling retry ${attempts}/${this.maxRetryAttempts} for chapter ${chapterId} ` +
        `(category: ${classification.category})`
    )

    const failedDownloadData = chapterDownloadsRepo.getDownload(chapterId)

    if (!failedDownloadData) {
      mainLog.error(
        `[DownloadQueue] Failed to find download data for chapter ${chapterId} in the database after failure. Can't schedule retry.`
      )
      return
    }

    const item: QueuedDownloads = {
      chapterId: failedDownloadData.chapterId,
      mangaId: failedDownloadData.mangaId,
      quality: failedDownloadData.imageQuality,
      language: failedDownloadData.language || 'en',
      addedAt: new Date()
    }

    this.scheduleRetry(item, classification)
  }

  private scheduleRetry(item: QueuedDownloads, classification: ErrorClassification): void {
    const attempts = this.retryCount.get(item.chapterId) || 0

    if (attempts >= this.maxRetryAttempts) {
      mainLog.warn(
        `[DownloadQueue] Max retry attempts reached for chapter ${item.chapterId}. Marking as failed.`
      )
      this.scheduleBatchUpdate({
        chapterId: item.chapterId,
        isFailed: true,
        storageSize: 0,
        totalPages: 0
      })
      this.retryCount.delete(item.chapterId)
      return
    }

    // Calculate retry delay based on error category
    const delay = this.getRetryDelayForError(classification, attempts)

    mainLog.info(
      `[DownloadQueue] Scheduling retry #${attempts} for chapter ${item.chapterId} in ${delay / 1000} seconds.`
    )

    setTimeout(() => {
      // Fix race condition: Check for duplicates before adding to queue
      if (this.activeDownloads.has(item.chapterId)) {
        mainLog.warn(
          `[DownloadQueue] Chapter ${item.chapterId} already downloading, skipping retry`
        )
        return
      }
      if (this.queue.some((q) => q.chapterId === item.chapterId)) {
        mainLog.warn(`[DownloadQueue] Chapter ${item.chapterId} already in queue, skipping retry`)
        return
      }

      // Add back to the first position in the queue to retry immediately after the delay
      this.queue.unshift(item)
      this.processQueue()
    }, delay)
  }

  /**
   * Calculate retry delay based on error category with jitter
   * Different error types get different retry strategies
   * Jitter prevents thundering herd when many downloads fail simultaneously
   */
  private getRetryDelayForError(classification: ErrorClassification, attempt: number): number {
    let baseDelay: number

    // If classification includes a suggested delay (e.g., rate limit with Retry-After header), use it
    if (classification.suggestedDelayMs) {
      baseDelay = classification.suggestedDelayMs
    } else {
      switch (classification.category) {
        case DownloadErrorCategory.RATE_LIMIT:
          // Exponential backoff for rate limits: 1s, 2s, 4s, 8s (capped at 60s)
          baseDelay = Math.min(1000 * Math.pow(2, attempt), 60000)
          break

        case DownloadErrorCategory.TRANSIENT_NETWORK:
          // Longer delays for network issues: 10s, 30s, 60s
          baseDelay = [10000, 30000, 60000][attempt - 1] ?? 60000
          break

        case DownloadErrorCategory.TRANSIENT_SERVER:
          // Standard delays for server errors: 5s, 15s, 45s
          baseDelay = getRetryDelay(attempt, this.retryDelays)
          break

        default:
          // Unknown errors use conservative standard delays
          baseDelay = getRetryDelay(attempt, this.retryDelays)
      }
    }

    // Add jitter: ±20% randomization to prevent synchronized retries
    // This spreads out retry attempts when multiple downloads fail simultaneously
    const jitterFactor = 0.8 + Math.random() * 0.4 // Random between 0.8 and 1.2
    const delayWithJitter = Math.floor(baseDelay * jitterFactor)

    return delayWithJitter
  }

  private scheduleBatchUpdate(command: MarkDownloadStateCommand): void {
    this.pendingUpdates.push(command)

    // Process the batch after we have 25 of them, or after 500ms has passed, whichever comes first
    // Optimized from 10 items / 1000ms for better throughput with parallel downloads
    if (this.pendingUpdates.length >= 25) {
      this.flushBatchUpdates()
    } else
      this.batchUpdateTimeout ??= setTimeout(() => {
        this.flushBatchUpdates()
      }, 500)
  }

  private flushBatchUpdates(): void {
    // If we have nothing to do, skip
    if (this.pendingUpdates.length === 0) {
      return
    }

    try {
      // Process the batch updates in the database
      chapterDownloadsRepo.batchMarkDownloadsState(this.pendingUpdates)
    } catch (error) {
      mainLog.error('[DownloadQueue] Batch update failed, attempting individual updates:', error)

      // Fallback: Try updating each item individually
      for (const command of this.pendingUpdates) {
        try {
          chapterDownloadsRepo.markDownloadState(command)
        } catch (individualError) {
          mainLog.error(
            `[DownloadQueue] CRITICAL: Failed to update download state for chapter ${command.chapterId}:`,
            individualError
          )
          // Emit error to UI so user knows there's a problem
          const browserWindow = BrowserWindow.getAllWindows()[0]
          if (browserWindow) {
            browserWindow.webContents.send('download:database-error', {
              chapterId: command.chapterId,
              error: 'Failed to save download progress. Data may be inconsistent.'
            })
          }
        }
      }
    }

    // Clear the batch and timeout
    this.pendingUpdates = []
    if (this.batchUpdateTimeout) {
      clearTimeout(this.batchUpdateTimeout)
      this.batchUpdateTimeout = undefined
    }
  }

  private emitOverallProgress(): void {
    const now = Date.now()
    if (now - this.lastEmit >= this.emitInterval) {
      // Use cached download stats if available and fresh (< 1 second old)
      // This reduces database queries from ~10/sec to ~1/sec during heavy download activity
      if (!this.cachedDownloadStats || now - this.lastCacheUpdate >= this.cacheValidityMs) {
        this.cachedDownloadStats = chapterDownloadsRepo.getAllDownloads()
        this.lastCacheUpdate = now
      }

      const stats = calculateAggregateStats(
        this.queue,
        this.activeDownloads.size,
        this.cachedDownloadStats
      )
      emitOverallProgressEvent(stats)
      this.lastEmit = now
    }
  }

  // Always get fresh number of concurrent downloads from settings in case the user changes it while downloading
  private async getConcurrentDownloadsSize(): Promise<number> {
    const maxConcurrent = await getSettingByPath('downloads', 'maxConcurrentDownloads')
    return maxConcurrent as number
  }

  // Used on app shutdown to commit any database updates that might not have been flushed
  cleanup(): void {
    this.flushBatchUpdates()
    if (this.batchUpdateTimeout) {
      clearTimeout(this.batchUpdateTimeout)
    }
  }
}
export const downloadQueueService = new DownloadQueueService()
