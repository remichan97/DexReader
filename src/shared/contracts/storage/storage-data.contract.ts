import { MangaStorageContract } from '@shared/contracts/database/chapter-downloads/manga-storage.contract'
import { DiskCacheContract } from '@shared/contracts/database/storage/disk-cache.contract'
import { DiskSpaceData } from '../../../main/services/data/disk-space.data'

export interface StorageDataContract {
  mangaStorage: MangaStorageContract
  diskSpace: DiskSpaceData
  cacheSize: DiskCacheContract
}
