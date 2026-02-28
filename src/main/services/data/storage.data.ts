import { MangaStorageQuery } from '../../database/queries/chapter-downloads/manga-storage.query'
import { DiskSpaceData } from './disk-space.data'

export interface StorageData {
  mangaStorage: MangaStorageQuery
  diskSpace: DiskSpaceData
}
