export interface BackupTracking {
  syncId: number
  libraryId: number
  mediaIdInt?: number
  trackingUrl?: string
  title?: string
  lastChapterRead?: number
  totalChapters?: number
  score?: number
  status?: number
  startedReadingDate?: number
  finishedReadingDate?: number
  private?: boolean
  mediaId?: bigint
}
