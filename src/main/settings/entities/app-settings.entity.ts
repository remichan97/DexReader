import { DownloadSettings } from './downloads-settings.entity'
import { AppearanceSettings } from './appearance-settings.entity'
import { ReaderSettings } from './reader-settings.entity'

export interface AppSettings {
  downloads: DownloadSettings
  appearance: AppearanceSettings
  reader: ReaderSettings
}
