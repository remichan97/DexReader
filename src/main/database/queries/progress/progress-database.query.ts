import { MangaProgressQuery } from './manga-progress.query'

export interface ProgressDatabase {
  version: number
  lastUpdated: number //unix timestamp
  manga: Record<string, MangaProgressQuery>
}
