import { MangaStorageByTitleContract } from './manga-storage-by-title.contract'

export interface MangaStorageContract {
  totalAppStorage: number // in bytes, sum of all manga storage
  mangaStorageByTitle: MangaStorageByTitleContract[] // array of manga storage details
}
