import { cleanupRepo } from '../../database/repositories/cleanup-repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { loadSettings, saveSettings } from '../../settings/settings-manager'
import { isDownloadsSettings } from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrap-handler'
import type { ImageProxy } from '../../api/proxy/image.proxy'

export function registerStorageHandlers(imageProxy?: ImageProxy): void {
  wrapIpcHandler('storage:get-stats', async () => {
    return mangaRepo.statsMangaTable()
  })

  wrapIpcHandler('storage:clear-manga-cache', async (_, immediate: unknown) => {
    if (typeof immediate !== 'boolean') {
      throw new TypeError('Invalid parameter for clearing manga cache')
    }

    return mangaRepo.cleanupMangaCache(immediate)
  })

  wrapIpcHandler('storage:optimise-manga-cache', async () => {
    return await cleanupRepo.reclaimStorage()
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

    // Use validated approach: load settings, update field, validate section, save
    const settings = await loadSettings()
    settings.downloads.maxDiskCacheSize = byteLimit

    if (!isDownloadsSettings(settings.downloads)) {
      throw new Error('Invalid downloads settings after updating cache limit')
    }

    await saveSettings(settings)
  })

  // Image cache metrics (for performance optimization - P5-T04)
  wrapIpcHandler('image-proxy:get-metrics', async () => {
    if (!imageProxy) {
      throw new Error('ImageProxy not available')
    }
    return imageProxy.collectMetrics()
  })
}
