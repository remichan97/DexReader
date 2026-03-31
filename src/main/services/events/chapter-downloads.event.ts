import { DownloadStatus } from '../../database/enums/download-status.enum'

export interface ChapterDownloadsEvent {
  chapterId: string
  currentPage: number
  totalPages: number
  percentage: number
  bytesDownloaded: number
  status: DownloadStatus
}
