export interface OverallProgress {
  totalChapters: number
  completedChapters: number
  failedChapters: number
  activeDownloads: number
  completedPages: number
  totalPages: number
  overallPercentage: number
  estimatedTimeRemaining?: number
}
