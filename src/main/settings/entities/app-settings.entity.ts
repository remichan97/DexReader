import { DownloadSettings } from './downloads-settings.entity'
import { AppearanceSettings } from './appearance-settings.entity'
import { ReaderSettings } from './reader-settings.entity'
import { UpdateSettings } from './update-settings.entity'
import { LogsSettings } from './logs-settings.entity'

export interface AppSettings {
  downloads: DownloadSettings
  appearance: AppearanceSettings
  reader: ReaderSettings
  update: UpdateSettings
  logs: LogsSettings
}
