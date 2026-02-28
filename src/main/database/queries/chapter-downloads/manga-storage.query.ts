import { MangaStorageByTitleQuery } from './manga-storage-by-title.query'

export interface MangaStorageQuery {
  totalAppStorage: number // in bytes, sum of all manga storage
  mangaStorageByTitle: MangaStorageByTitleQuery[] // array of manga storage details
}
