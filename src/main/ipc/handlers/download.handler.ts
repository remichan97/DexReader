import { downloadService } from './../../services/download.service'
import { DownloadChapterOptions } from './../../services/options/download-chapter.option'
import { wrapIpcHandler } from '../wrapHandler'
import {
  isDownloadChapterOptions,
  isQueuedDownloads
} from '../../settings/validators/types.validator'
import { downloadQueueService } from '../../services/download-queue.service'
import { QueuedDownloads } from '../../services/types/downloads/queued-downloads.type'

export function registerDownloadHandlers(): void {
  wrapIpcHandler('downloads:download-chapter', async (_, params: unknown) => {
    isDownloadChapterOptions(params)

    if (!isDownloadChapterOptions(params)) {
      throw new TypeError('Invalid parameters for downloading chapter')
    }

    const options: DownloadChapterOptions = {
      chapterId: params.chapterId,
      mangaId: params.mangaId,
      language: params.language,
      quality: params.quality
    }

    return await downloadService.downloadChapter(options)
  })

  wrapIpcHandler('downloads:delete-chapter', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for deleting chapter')
    }

    return await downloadService.deleteChapter(chapterId)
  })

  wrapIpcHandler('download:get-all-downloads', async () => {
    return downloadService.getAllDownloads()
  })

  wrapIpcHandler('download:clear-completed', async () => {
    return downloadService.clearCompletedDownloads()
  })

  wrapIpcHandler('download:get-download', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for getting download')
    }

    return downloadService.isDownloaded(chapterId)
  })

  wrapIpcHandler('download:is-downloaded', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for checking download')
    }

    return downloadService.isDownloaded(chapterId)
  })

  wrapIpcHandler('download:storage-stats', async () => {
    return downloadService.getStorageInfo()
  })

  wrapIpcHandler('download:delete-manga', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for deleting manga downloads')
    }

    if (!mangaId) {
      throw new TypeError('MangaId is required for deleting manga downloads')
    }

    return await downloadService.deleteManga(mangaId)
  })

  wrapIpcHandler('download:batch-delete-manga', async (_, mangaIds: unknown) => {
    if (!Array.isArray(mangaIds) || mangaIds.some((id) => typeof id !== 'string')) {
      throw new TypeError('Invalid mangaIds for batch deleting manga downloads')
    }

    if (mangaIds.length === 0) {
      throw new TypeError('At least one mangaId is required for batch deleting manga downloads')
    }

    return await downloadService.batchDeleteManga(mangaIds)
  })

  wrapIpcHandler('download:add-to-queue', async (_, params: unknown) => {
    isQueuedDownloads(params)

    if (!isQueuedDownloads(params)) {
      throw new TypeError('Invalid parameters for adding chapter to download queue')
    }

    const options: QueuedDownloads = {
      chapterId: params.chapterId,
      mangaId: params.mangaId,
      language: params.language,
      quality: params.quality,
      addedAt: params.addedAt
    }

    return downloadQueueService.addToQueue(options)
  })

  wrapIpcHandler('download:add-batch-to-queue', async (_, params: unknown) => {
    if (!Array.isArray(params)) {
      throw new TypeError('Invalid parameters for adding batch of chapters to download queue')
    }

    const options: QueuedDownloads[] = params.map((param) => {
      if (!isQueuedDownloads(param)) {
        throw new TypeError('Invalid parameters for adding chapter to download queue')
      }

      return {
        chapterId: param.chapterId,
        mangaId: param.mangaId,
        language: param.language,
        quality: param.quality,
        addedAt: param.addedAt
      }
    })

    return downloadQueueService.addBatchToQueue(options)
  })

  wrapIpcHandler('download:remove-from-queue', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for removing chapter from download queue')
    }

    return downloadQueueService.removeFromQueue(chapterId)
  })

  wrapIpcHandler('download:clear-queue', async () => {
    return downloadQueueService.clearQueue()
  })

  wrapIpcHandler('download:cancel-all-queued', async () => {
    return downloadQueueService.cancelAllQueued()
  })

  wrapIpcHandler('download:retry', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for retrying download')
    }

    return downloadQueueService.retryDownload(chapterId)
  })

  wrapIpcHandler('download:get-queue-stats', async () => {
    return downloadQueueService.getQueueStats()
  })

  wrapIpcHandler('download:get-queued-items', async () => {
    return downloadQueueService.getQueuedItems()
  })
}
