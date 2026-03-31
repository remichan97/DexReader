import { BrowserWindow } from 'electron'
import { DownloadStatus } from '../../database/enums/download-status.enum'
import { ChapterDownloadQuery } from '../../database/queries/chapter-downloads/chapter-downloads.query'
import { OverallProgress } from '../types/downloads/overall-progress.type'
import { QueuedDownloads } from '../types/downloads/queued-downloads.type'

/**
 * Calculate aggregate download statistics across all downloads
 * @param queue Current queued items
 * @param activeDownloadsSize Number of active downloads
 * @param allDownloads All downloads from database
 * @returns Overall progress statistics
 */
export function calculateAggregateStats(
  queue: QueuedDownloads[],
  activeDownloadsSize: number,
  allDownloads: ChapterDownloadQuery[]
): OverallProgress {
  const completed = allDownloads.filter((d) => d.status === DownloadStatus.Completed)
  const failed = allDownloads.filter((d) => d.status === DownloadStatus.Failed)

  const totalChapters = queue.length + activeDownloadsSize + completed.length + failed.length
  const completedPages = completed.reduce((sum, d) => sum + d.totalPages, 0)
  const totalPages = allDownloads.reduce((sum, d) => sum + d.totalPages, 0)

  return {
    totalChapters,
    completedChapters: completed.length,
    failedChapters: failed.length,
    activeDownloads: activeDownloadsSize,
    totalPages,
    completedPages,
    overallPercentage: totalPages > 0 ? (completedPages / totalPages) * 100 : 0
  }
}

/**
 * Emit a permanent failure notification to the renderer process
 * @param chapterId Chapter ID that permanently failed
 * @param customMessage Optional custom error message for specific failure reasons
 */
export function emitPermanentFailureNotification(chapterId: string, customMessage?: string): void {
  const browserWindow = BrowserWindow.getAllWindows()[0]
  if (browserWindow) {
    browserWindow.webContents.send('download:permanent-failure', {
      chapterId,
      message:
        customMessage ||
        `Download failed after multiple attempts for chapter ${chapterId}. Please check your connection or try again later.`
    })
  }
}

/**
 * Emit overall progress statistics to the renderer process
 * @param stats Overall progress statistics
 */
export function emitOverallProgressEvent(stats: OverallProgress): void {
  const browserWindow = BrowserWindow.getAllWindows()[0]
  if (browserWindow) {
    browserWindow.webContents.send('download:queue-progress', stats)
  }
}

/**
 * Get retry delay in milliseconds based on attempt number
 * @param attemptNumber Current retry attempt (1-indexed)
 * @param retryDelays Array of delay values for each attempt
 * @returns Delay in milliseconds
 */
export function getRetryDelay(attemptNumber: number, retryDelays: number[]): number {
  return retryDelays[attemptNumber - 1] ?? retryDelays.at(-1) ?? 5000
}
