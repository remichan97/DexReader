import { MangaProgressContract } from './manga-progress.contract'

export interface ProgressDatabaseContract {
  version: number
  lastUpdated: number //unix timestamp
  manga: Record<string, MangaProgressContract>
}
