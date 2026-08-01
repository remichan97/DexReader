import { ReaderPerformanceSettings } from './reader-performance-settings.entity'
import { ImageQuality } from '../../api/enums/image-quality.enum'
import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'

export interface ReaderSettings {
  forceDarkMode: boolean
  quality: ImageQuality
  global: MangaReadingSettings
  performance: ReaderPerformanceSettings
}
