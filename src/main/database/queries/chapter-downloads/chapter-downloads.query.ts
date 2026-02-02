import { ImageQuality } from '../../../api/enums'
import { DownloadStatus } from '../../enums/download-status.enum'

export interface ChapterDownloadQuery {
  chapterId: string
  mangaId: string
  status: DownloadStatus
  downloadedAt: number
  filePath: string
  totalPages: number
  storageSize: number
  imageQuality: ImageQuality
  errorMessage?: string

  // Data from Manga table
  title: string
  coverUrl?: string

  // Data from Chapter table
  chapterNumber: string
  chapterTitle?: string
  volume?: string
  language?: string
}
