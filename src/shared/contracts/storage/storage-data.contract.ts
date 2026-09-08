import { MangaStorageContract } from '@shared/contracts/database/chapter-downloads/manga-storage.contract'
import { DiskCacheContract } from '@shared/contracts/database/storage/disk-cache.contract'
import { DiskSpaceContract } from './disk-space-data.contract'

export interface StorageDataContract {
  mangaStorage: MangaStorageContract
  diskSpace: DiskSpaceContract
  cacheSize: DiskCacheContract
}
