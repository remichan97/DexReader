export interface MarkDownloadStateCommand {
  chapterId: string
  isDownloaded?: boolean
  storageSize: number
  totalPages: number
  imageFormat?: string
  isFailed?: boolean
  errorMessage?: string
}
