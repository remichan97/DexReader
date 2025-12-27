import { ImageQuality } from '../../api/enums/image-quality.enum'
import { MangaReadingSettings } from './reading-settings.entity'

export interface ReaderSettings {
  forceDarkMode: boolean
  quality: ImageQuality
  global: MangaReadingSettings
}
