import { MangaReadingSettings } from '../../../contracts/settings/reading-settings.contract'

export interface UpdateMangaOverrideCommand {
  mangaId: string
  overrideData: MangaReadingSettings
}
