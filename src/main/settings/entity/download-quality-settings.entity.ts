import { ImageQuality } from '../../api/enums'

export interface DownloadQualitySettings {
  shouldAskForQuality: boolean
  defaultQuality: ImageQuality
}
