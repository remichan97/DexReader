export interface DownloadChapterResult {
  chapterId: string
  success: boolean
  totalPages: number
  storageSize: number // bytes
  filePath: string // Relative path from downloads root
  errorMessage?: string
}
