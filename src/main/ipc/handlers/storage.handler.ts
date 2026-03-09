import { destructionRepo } from '../../database/repository/destruction-repo'
import { mangaRepository } from '../../database/repository/manga.repo'
import { setSettingByPath } from '../../settings/settingsManager'
import { wrapIpcHandler } from '../wrapHandler'

export function registerStorageHandlers(): void {
  wrapIpcHandler('storage:get-stats', async () => {
    return mangaRepository.statsMangaTable()
  })

  wrapIpcHandler('storage:clear-manga-cache', async (_, immediate: unknown) => {
    if (typeof immediate !== 'boolean') {
      throw new TypeError('Invalid parameter for clearing manga cache')
    }

    return mangaRepository.cleanupMangaCache(immediate)
  })

  wrapIpcHandler('storage:optimise-manga-cache', async () => {
    return await destructionRepo.reclaimStorage()
  })

  wrapIpcHandler('storage:set-cover-cache-limit', async (_, limit: unknown) => {
    if (typeof limit !== 'number' || limit < 0) {
      throw new TypeError('Invalid cover cache limit value')
    }

    // Make sure we only accept the value ranging from 10 MB to 500 MB (after converted to bytes) to prevent potential issues, 0 is accepted as it means "unlimited"
    const byteLimit = limit * 1024 * 1024
    if (byteLimit !== 0 && (byteLimit < 10 * 1024 * 1024 || byteLimit > 500 * 1024 * 1024)) {
      throw new RangeError('Cover cache limit must be between 10 MB and 500 MB')
    }

    return await setSettingByPath('downloads', 'maxDiskCacheSize', limit)
  })
}
