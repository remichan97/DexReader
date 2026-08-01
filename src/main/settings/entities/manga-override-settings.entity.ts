import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'

export interface MangaOverrideSettings {
  title: string
  coverUrl?: string
  settings: MangaReadingSettings
}
