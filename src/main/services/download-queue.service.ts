import { DownloadStatus } from '../database/enums/download-status.enum'
import { chapterDownloadsRepo } from '../database/repository/chapter-downloads.repo'
import { downloadService } from './download.service'
import { DownloadChapterOptions } from './options/download-chapter.option'
import { DownloadChapterResult } from './results/dexreader/download-chapter.result'
import { QueueState } from './types/downloads/queue-state.type'
import { QueuedDownloads } from './types/downloads/queued-downloads.type'
import { getSettingByPath } from '../settings/settingsManager'
import {
  calculateAggregateStats,
  emitOverallProgressEvent,
  emitPermanentFailureNotification,
  getRetryDelay
} from './helpers/download-queue.helper'
import { MarkDownloadStateCommand } from '../database/commands/chapter-downloads/mark-state.command'

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
  getQueuedItems(): QueuedDownloads[] {
    return [...this.queue]
  }

  // Resume any incompleted downloads
  resumeIncompletedDownloads(): void {
    console.log('Looking for incompleted downloads to resume...')

    const allDownloads = chapterDownloadsRepo.getAllDownloads()
    const incompletedDownloads = allDownloads.filter(
      (d) => d.status === DownloadStatus.Downloading || d.status === DownloadStatus.Queued
    )

    if (incompletedDownloads.length === 0) {
      console.log('No incompleted downloads found.')
      return
    }

    console.log(`Found ${incompletedDownloads.length} incompleted downloads. Resuming...`)

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

    console.log(`Cancelled ${queuedCount} queued downloads`)

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

  retryDownload(chapterId: string): void {
    // Reset retry count for this chapter
    this.retryCount.delete(chapterId)

    // Query the database for the download data
    const downloadData = chapterDownloadsRepo.getDownload(chapterId)

    if (downloadData?.status !== DownloadStatus.Failed) {
      console.warn(`Can't retry an unknown or non-failed download with chapterId ${chapterId}`)
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
    console.log(`Download completed for chapter ${chapterId}`)
    this.retryCount.delete(chapterId)
    this.emitOverallProgress()
  }

  private handleDownloadFailure(chapterId: string, error: unknown): void {
    console.error(`Download failed for chapter ${chapterId}:`, error)

    const attempts = (this.retryCount.get(chapterId) || 0) + 1
    this.retryCount.set(chapterId, attempts)

    if (attempts >= this.maxRetryAttempts) {
      console.error('[Failure] Max retry attempts reached for chapter', chapterId)

      this.retryCount.delete(chapterId)
      // Throw a notification to the user that the download has permanently failed and they should check their connection or try again later
      emitPermanentFailureNotification(chapterId)

      return
    }

    console.log(`Scheduling retry #${attempts} for chapter ${chapterId} after failure.`)

    const failedDownloadData = chapterDownloadsRepo.getDownload(chapterId)

    if (!failedDownloadData) {
      console.error(
        `Failed to find download data for chapter ${chapterId} in the database after failure. Can't schedule retry.`
      )
      return
    }

    const item: QueuedDownloads = {
      chapterId: failedDownloadData.chapterId,
      mangaId: failedDownloadData.mangaId,
      quality: failedDownloadData.imageQuality,
      language: failedDownloadData.language || 'en',
      addedAt: new Date() // We can set the addedAt to now since we're retrying them, not adding them for the first time
    }

    this.scheduleRetry(item)
  }

  private scheduleRetry(item: QueuedDownloads): void {
    const attempts = this.retryCount.get(item.chapterId) || 0

    if (attempts >= this.maxRetryAttempts) {
      console.warn(`Max retry attempts reached for chapter ${item.chapterId}. Marking as failed.`)
      this.scheduleBatchUpdate({
        chapterId: item.chapterId,
        isFailed: true,
        storageSize: 0,
        totalPages: 0
      })
      this.retryCount.delete(item.chapterId)
      return
    }

    const delay = getRetryDelay(attempts, this.retryDelays)
    console.log(
      `Scheduling retry #${attempts} for chapter ${item.chapterId} in ${delay / 1000} seconds.`
    )

    setTimeout(() => {
      // Add back to the first position in the queue to retry immediately after the delay
      this.queue.unshift(item)
      this.processQueue()
    }, delay)
  }

  private scheduleBatchUpdate(command: MarkDownloadStateCommand): void {
    this.pendingUpdates.push(command)

    // Process the batch after we have 10 of them, or after a second has passed, whichever comes first
    if (this.pendingUpdates.length >= 10) {
      this.flushBatchUpdates()
    } else
      this.batchUpdateTimeout ??= setTimeout(() => {
        this.flushBatchUpdates()
      }, 1000)
  }

  private flushBatchUpdates(): void {
    // If we have nothing to do, skip
    if (this.pendingUpdates.length === 0) {
      return
    }

    // Process the batch updates in the database
    chapterDownloadsRepo.batchMarkDownloadsState(this.pendingUpdates)

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
      const allDownloads = chapterDownloadsRepo.getAllDownloads()
      const stats = calculateAggregateStats(this.queue, this.activeDownloads.size, allDownloads)
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
