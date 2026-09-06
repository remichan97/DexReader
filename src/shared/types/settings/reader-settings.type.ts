import { ReaderPerformanceSettings } from './reader-performance-settings.type'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'

export interface ReaderSettings {
  forceDarkMode: boolean
  quality: ImageQuality
  global: MangaReadingSettings
  performance: ReaderPerformanceSettings
}
