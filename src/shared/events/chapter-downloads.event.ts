import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'

export interface ChapterDownloadsEvent {
  chapterId: string
  currentPage: number
  totalPages: number
  percentage: number
  bytesDownloaded: number
  status: DownloadStatus
}
