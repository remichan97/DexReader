// Filter and Sort Types
export type FilterOption = 'all' | 'active' | 'completed' | 'failed'
export type SortOption = 'recent' | 'largest' | 'smallest' | 'az' | 'za'

// Event Interfaces
export interface ChapterProgressEvent {
  chapterId: string
  currentPage: number
  totalPages: number
  percentage: number
  bytesDownloaded: number
  status: 'queued' | 'downloading' | 'completed' | 'failed'
}

export interface QueueProgressEvent {
  totalChapters: number
  completedChapters: number
  failedChapters: number
  activeDownloads: number
  completedPages: number
  totalPages: number
  overallPercentage: number
  estimatedTimeRemaining?: number
}
