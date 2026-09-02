import { ImageQuality } from '@shared/enums/mangadex'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'

export interface ChapterDownloadContract {
  chapterId: string
  mangaId: string
  status: DownloadStatus
  downloadedAt: number
  downloadsBasePath: string
  filePath: string
  totalPages: number
  storageSize: number
  imageQuality: ImageQuality
  imageFormat: string
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
