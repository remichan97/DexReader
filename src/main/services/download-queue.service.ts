import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { chapterDownloadsRepo } from '../database/repositories/chapter-downloads.repo'
import { downloadService } from './download.service'
import { QueueState } from '../../shared/types/downloads/queue-state.type'
import { QueuedDownloads } from '../../shared/types/downloads/queued-downloads.type'
import { DownloadRetryScheduler } from './download-queue/retry-scheduler'
import { DownloadBatchWriter } from './download-queue/batch-writer'
import { DownloadProgressReporter } from './download-queue/progress-reporter'
import { mainLog } from './logging/main-logging.service'
import { settingsManager } from '../settings/settings-manager'
import { DownloadChapterCommand } from '@shared/commands/services/download-chapter.command'
import { DownloadChapterContract } from '@shared/contracts/services/dexreader/download-chapter.contract'

class DownloadQueueService {
  // Main states
  private queue: QueuedDownloads[] = []
  private readonly activeDownloads: Map<string, Promise<DownloadChapterContract>> = new Map()

  // Collaborators: retry/backoff scheduling, batched DB writes, and throttled
  // progress emission each own their own state - this service composes them
  // and owns only the queue/active-downloads themselves.
  private readonly retryScheduler = new DownloadRetryScheduler({
    isQueuedOrActive: (chapterId) => this.isQueuedOrActive(chapterId),
    requeue: (item) => this.requeue(item),
    markPermanentlyFailed: (command) => this.batchWriter.scheduleUpdate(command)
  })
  private readonly batchWriter = new DownloadBatchWriter()
  private readonly progressReporter = new DownloadProgressReporter()

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
    this.retryScheduler.resetAttempts(chapterId)

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
    const downloadOptions: DownloadChapterCommand = {
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
      this.retryScheduler.handleFailure(item.chapterId, error)
    } finally {
      // Whatever happens, remove the download from the active list, then proceed to the next item in the queue
      this.activeDownloads.delete(item.chapterId)
      this.processQueue()
    }
  }

  private handleDownloadCompleted(chapterId: string): void {
    mainLog.info(`[DownloadQueue] Download completed for chapter ${chapterId}`)
    this.retryScheduler.resetAttempts(chapterId)
    this.progressReporter.emitIfDue(this.queue, this.activeDownloads.size)
  }

  // Whether a chapter is already downloading or already queued - used by the
  // retry scheduler to avoid duplicating a retry that's no longer needed.
  private isQueuedOrActive(chapterId: string): boolean {
    return this.activeDownloads.has(chapterId) || this.queue.some((q) => q.chapterId === chapterId)
  }

  // Put a retried item back at the front of the queue and resume processing.
  private requeue(item: QueuedDownloads): void {
    this.queue.unshift(item)
    this.processQueue()
  }

  // Always get fresh number of concurrent downloads from settings in case the user changes it while downloading
  private async getConcurrentDownloadsSize(): Promise<number> {
    const maxConcurrent = settingsManager.getByPath('downloads', 'maxConcurrentDownloads')
    return maxConcurrent
  }

  // Used on app shutdown to commit any database updates that might not have been flushed
  cleanup(): void {
    this.batchWriter.flush()
  }
}
export const downloadQueueService = new DownloadQueueService()
