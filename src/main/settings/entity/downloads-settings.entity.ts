import { ImageQuality } from '../../api/enums'
import { DownloadConfirmation } from '../enum/download-confirmation.enum'

export interface DownloadSettings {
  downloadPath?: string
  maxConcurrentDownloads: number
  shouldConfirmDownload: DownloadConfirmation
  defaultQuality: ImageQuality
}
