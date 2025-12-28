import { MangaProgress } from './manga-progress.entity'

export interface ProgressDatabase {
  version: number
  lastUpdated: number //unix timestamp
  manga: Record<string, MangaProgress>
}
