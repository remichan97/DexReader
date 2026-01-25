import { MangaReadingSettings } from '../../../settings/entity/reading-settings.entity'

export interface MangaOverrideQuery {
  mangaId: string
  readerSettings: MangaReadingSettings
  createdAt: Date
  updatedAt: Date
}
