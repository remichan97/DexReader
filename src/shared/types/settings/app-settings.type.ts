import { AppearanceSettings } from './appearance-settings.type'
import { DownloadSettings } from './downloads-settings.type'
import { LanguageSettings } from './language-settings.type'
import { LogsSettings } from './logs-settings.type'
import { ReaderSettings } from './reader-settings.type'
import { SearchSettings } from './search-settings.type'
import { SnapshotSettings } from './snapshot-settings.type'
import { SystemSettings } from './system-settings.type'
import { UpdateSettings } from './update-settings.type'

export interface AppSettings {
  version: number
  downloads: DownloadSettings
  appearance: AppearanceSettings
  reader: ReaderSettings
  update: UpdateSettings
  logs: LogsSettings
  search: SearchSettings
  language: LanguageSettings
  snapshot: SnapshotSettings
  system: SystemSettings
}
