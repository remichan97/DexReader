export interface DownloadBatchSettings {
  shouldConfirmBatchDownload: boolean // Whether to show a confirmation dialog for batch downloads
  batchConfirmThreshold: number // Minimum number of chapters to trigger batch download confirmation (optional, default: 5)
}
