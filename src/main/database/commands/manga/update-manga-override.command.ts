import { MangaReadingSettings } from '../../../settings/entities/reading-settings.entity'

export interface UpdateMangaOverrideCommand {
  mangaId: string
  overrideData: MangaReadingSettings
}
