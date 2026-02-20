import { ImageQuality } from '../../api/enums'
import { DownloadBatchSettings } from './download-batch-settings.entity'

export interface DownloadSettings {
  downloadPath?: string
  downloadQuality: ImageQuality
  maxConcurrentDownloads: number
  batchDownloadSettings: DownloadBatchSettings
}
