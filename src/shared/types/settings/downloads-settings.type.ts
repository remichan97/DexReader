import { ImageQuality } from '../../../main/api/enums'
import { DownloadConfirmation } from '../../enums/settings/download-confirmation.enum'

export interface DownloadSettings {
  downloadPath?: string
  maxConcurrentDownloads: number
  shouldConfirmDownload: DownloadConfirmation
  defaultQuality: ImageQuality
  maxDiskCacheSize: number // in bytes, maximum size of the caching for cover cache, set 0 for unlimited
}
