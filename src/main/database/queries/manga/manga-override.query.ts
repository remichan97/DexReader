import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'

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
