import { ImageQuality } from '@shared/enums/mangadex'
import { DownloadConfirmation } from '../../enums/settings/download-confirmation.enum'

export interface DownloadSettings {
  downloadPath?: string
  maxConcurrentDownloads: number
  shouldConfirmDownload: DownloadConfirmation
  defaultQuality: ImageQuality
  maxDiskCacheSize: number // in bytes, maximum size of the caching for cover cache, set 0 for unlimited
}
