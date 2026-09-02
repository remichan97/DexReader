import { chapterDownloadsRepo } from '../../database/repositories/chapter-downloads.repo'
import { QueuedDownloads } from '../../../shared/types/downloads/queued-downloads.type'
import { emitPermanentFailureNotification, getRetryDelay } from '../helpers/download-queue.helper'
import { MarkDownloadStateCommand } from '@shared/commands/repositories/chapter-downloads/mark-state.command'
import {
  classifyDownloadError,
  ErrorClassification,
  getErrorSummary
} from '../errors/download-error-classifier'
import { DownloadErrorCategory } from '../errors/enums/download-error.enum'
import { mainLog } from '../logging/main-logging.service'

export interface RetrySchedulerCallbacks {
  /** Whether this chapter is already active or already sitting in the queue. */
  isQueuedOrActive: (chapterId: string) => boolean
  /** Put the item back at the front of the queue and kick off processing. */
  requeue: (item: QueuedDownloads) => void
  /** Persist a terminal (permanently-failed) state for this chapter. */
  markPermanentlyFailed: (command: MarkDownloadStateCommand) => void
}

/**
 * Decides whether a failed download should be retried, and if so, when -
 * classifying the error, tracking per-chapter attempt counts, and computing
 * a backoff delay (with jitter) per error category. Requeueing and
 * persistence are delegated back to the owning queue via callbacks, since
 * this scheduler doesn't own the queue's state itself.
 */
export class DownloadRetryScheduler {
  private readonly retryCount = new Map<string, number>()
  private readonly maxRetryAttempts = 3
  private readonly retryDelays = [5000, 15000, 45000] // in milliseconds, for each retry attempt

  public constructor(private readonly callbacks: RetrySchedulerCallbacks) {}

  /** Reset the attempt counter for a chapter (e.g. on successful completion or manual retry). */
  public resetAttempts(chapterId: string): void {
    this.retryCount.delete(chapterId)
  }

  /**
   * Handle a failed download: classify the error, then either mark it
   * permanently failed or schedule a backed-off retry.
   */
  public handleFailure(chapterId: string, error: unknown): void {
    const classification = classifyDownloadError(error)

    mainLog.error(
      `[DownloadQueue] Download failed for chapter ${chapterId}:`,
      getErrorSummary(error)
    )

    if (!classification.isRetryable) {
      mainLog.warn(
        `[DownloadQueue] Permanent error for chapter ${chapterId}, not retrying: ${classification.userMessage}`
      )
      this.failPermanently(chapterId, classification.userMessage)
      return
    }

    const attempts = (this.retryCount.get(chapterId) || 0) + 1
    this.retryCount.set(chapterId, attempts)

    if (attempts >= this.maxRetryAttempts) {
      mainLog.error(
        `[DownloadQueue] Max retry attempts (${this.maxRetryAttempts}) exceeded for chapter ${chapterId}`
      )
      this.failPermanently(
        chapterId,
        `Failed after ${attempts} attempts: ${classification.userMessage}`
      )
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

    this.scheduleRetry(item, classification, attempts)
  }

  private failPermanently(chapterId: string, message: string): void {
    this.callbacks.markPermanentlyFailed({
      chapterId,
      isFailed: true,
      errorMessage: message,
      storageSize: 0,
      totalPages: 0
    })
    this.retryCount.delete(chapterId)
    emitPermanentFailureNotification(chapterId, message)
  }

  private scheduleRetry(
    item: QueuedDownloads,
    classification: ErrorClassification,
    attempts: number
  ): void {
    const delay = this.getRetryDelayForError(classification, attempts)

    mainLog.info(
      `[DownloadQueue] Scheduling retry #${attempts} for chapter ${item.chapterId} in ${delay / 1000} seconds.`
    )

    setTimeout(() => {
      // Fix race condition: Check for duplicates before adding to queue
      if (this.callbacks.isQueuedOrActive(item.chapterId)) {
        mainLog.warn(
          `[DownloadQueue] Chapter ${item.chapterId} already downloading or queued, skipping retry`
        )
        return
      }

      this.callbacks.requeue(item)
    }, delay)
  }

  /**
   * Calculate retry delay based on error category with jitter.
   * Different error types get different retry strategies; jitter prevents
   * thundering herd when many downloads fail simultaneously.
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
}
