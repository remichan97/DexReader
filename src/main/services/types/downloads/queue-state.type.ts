import { QueuedDownloads } from './queued-downloads.type'

export interface QueueState {
  items: QueuedDownloads[]
  totalItems: number
  activeCounts: number
  completedCounts: number
  failedCounts: number
}
