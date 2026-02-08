export interface MarkDownloadStateCommand {
  chapterId: string
  isDownloaded?: boolean
  storageSize: number
  totalPages: number
  isFailed?: boolean
  errorMessage?: string
}
