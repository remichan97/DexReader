import { MangaReadingSettings } from '../../../settings/entity/reading-settings.entity'

/**
 * Query result for manga reader overrides with metadata
 * Used for exporting and displaying in Settings
 */
export interface MangaOverride {
  mangaId: string
  title: string
  coverUrl?: string
  readerSettings: MangaReadingSettings
  createdAt: Date
  updatedAt: Date
}
