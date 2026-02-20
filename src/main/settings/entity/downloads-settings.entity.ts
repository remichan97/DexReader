import { DownloadBatchSettings } from './download-batch-settings.entity'
import { DownloadQualitySettings } from './download-quality-settings.entity'

export interface DownloadSettings {
  downloadPath?: string
  downloadQuality: DownloadQualitySettings
  maxConcurrentDownloads: number
  batchDownloadSettings: DownloadBatchSettings
}
