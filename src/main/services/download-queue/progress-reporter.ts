import { chapterDownloadsRepo } from '../../database/repositories/chapter-downloads.repo'
import { QueuedDownloads } from '../../../shared/types/downloads/queued-downloads.type'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { calculateAggregateStats, emitOverallProgressEvent } from '../helpers/download-queue.helper'

/**
 * Throttles and emits overall download-progress events to the renderer.
 * Caches `getAllDownloads()` results for a second so a burst of progress
 * updates doesn't turn into a burst of DB queries (~10/sec -> ~1/sec during
 * heavy download activity).
 */
export class DownloadProgressReporter {
  private lastEmit = Date.now()
  private readonly emitInterval = 100 // At most 10 updates per second

  private cachedDownloadStats: ChapterDownloadContract[] | null = null
  private lastCacheUpdate = 0
  private readonly cacheValidityMs = 1000 // 1 second cache

  /** Emit an overall-progress event if the throttle interval has elapsed. */
  public emitIfDue(queue: QueuedDownloads[], activeDownloadsSize: number): void {
    const now = Date.now()
    if (now - this.lastEmit < this.emitInterval) {
      return
    }

    if (!this.cachedDownloadStats || now - this.lastCacheUpdate >= this.cacheValidityMs) {
      this.cachedDownloadStats = chapterDownloadsRepo.getAllDownloads()
      this.lastCacheUpdate = now
    }

    const stats = calculateAggregateStats(queue, activeDownloadsSize, this.cachedDownloadStats)
    emitOverallProgressEvent(stats)
    this.lastEmit = now
  }
}
