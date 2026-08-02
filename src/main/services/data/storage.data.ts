import { MangaStorageContract } from '@shared/contracts/database/chapter-downloads/manga-storage.contract'
import { DiskCacheContract } from '@shared/contracts/database/storage/disk-cache.contract'
import { DiskSpaceData } from './disk-space.data'

export interface StorageData {
  mangaStorage: MangaStorageContract
  diskSpace: DiskSpaceData
  cacheSize: DiskCacheContract
}
