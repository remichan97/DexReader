import { MangaReadingSettings } from '../../../settings/entity/reading-settings.entity'

export interface UpdateMangaOverrideCommand {
  mangaId: string
  overrideData: MangaReadingSettings
}
