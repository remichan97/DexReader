import { MangaReadingSettings } from './reading-settings.entity'

export interface MangaOverrideSettings {
  title: string
  coverUrl?: string
  settings: MangaReadingSettings
}
