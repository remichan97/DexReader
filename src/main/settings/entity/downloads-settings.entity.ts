import { ImageQuality } from '../../api/enums'

export interface DownloadSettings {
  downloadPath: string | null
  downloadQuality: ImageQuality
  concurrentChapterDownloads: number
}
