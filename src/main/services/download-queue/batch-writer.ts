import { BrowserWindow } from 'electron'
import { chapterDownloadsRepo } from '../../database/repositories/chapter-downloads.repo'
import { MarkDownloadStateCommand } from '@shared/commands/repositories/chapter-downloads/mark-state.command'
import { mainLog } from '../logging/main-logging.service'

/**
 * Batches per-chapter download-state writes so a burst of progress updates
 * (many chapters downloading in parallel) doesn't turn into one DB write per
 * update. Flushes after 25 pending updates or 500ms, whichever comes first,
 * and falls back to individual writes if the batch write itself fails.
 */
export class DownloadBatchWriter {
  private pendingUpdates: MarkDownloadStateCommand[] = []
  private batchUpdateTimeout: NodeJS.Timeout | undefined = undefined

  private static readonly FLUSH_BATCH_SIZE = 25
  private static readonly FLUSH_INTERVAL_MS = 500

  /** Queue a state update, flushing immediately once the batch is large enough. */
  public scheduleUpdate(command: MarkDownloadStateCommand): void {
    this.pendingUpdates.push(command)

    if (this.pendingUpdates.length >= DownloadBatchWriter.FLUSH_BATCH_SIZE) {
      this.flush()
    } else {
      this.batchUpdateTimeout ??= setTimeout(() => {
        this.flush()
      }, DownloadBatchWriter.FLUSH_INTERVAL_MS)
    }
  }

  /** Write all pending updates now (used for shutdown and the size/time triggers above). */
  public flush(): void {
    if (this.pendingUpdates.length === 0) {
      return
    }

    try {
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
}
