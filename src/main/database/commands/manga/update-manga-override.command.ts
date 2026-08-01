import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'

export interface UpdateMangaOverrideCommand {
  mangaId: string
  overrideData: MangaReadingSettings
}
