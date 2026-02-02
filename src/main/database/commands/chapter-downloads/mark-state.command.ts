export interface MarkDownloadStateCommand {
  chapterId: string
  isDownloaded?: boolean
  isFailed?: boolean
  errorMessage?: string
}
