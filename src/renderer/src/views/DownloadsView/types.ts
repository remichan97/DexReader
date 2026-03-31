import type { SelectOption } from '@renderer/components/Select'

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

// Select Options Constants
export const statusFilterOptions: SelectOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
]

export const sortOptions: SelectOption[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'largest', label: 'Largest First' },
  { value: 'smallest', label: 'Smallest First' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' }
]
