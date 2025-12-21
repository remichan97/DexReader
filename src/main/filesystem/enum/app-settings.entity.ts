import { ImageQuality } from '../../api/enums'
import { DownloadSettings } from '../entity/downloads-settings.entity'
import { ReaderSettings } from '../entity/reading-settings.entity'
import { AppTheme } from './theme-mode.enum'

export interface AppSettings {
  downloads: DownloadSettings
  theme: AppTheme
  accentColor: string | undefined // Accent color in hex format, e.g., '#FF5733'
  reader: {
    forceDarkMode: boolean // Whether to force dark mode in the reader
    quality: ImageQuality // Which image quality to use
    global: ReaderSettings // Global reader settings
    manga: Record<string, ReaderSettings> // Per-manga reader settings overrides, keyed by manga ID
  }
}
