import { downloadService } from './../../services/download.service'
import { DownloadChapterOptions } from './../../services/options/download-chapter.option'
import { ImageQuality } from '../../api/enums'
import { wrapIpcHandler } from '../wrapHandler'

export function registerDownloadHandlers(): void {
  wrapIpcHandler('downloads:download-chapter', async (_, params: unknown) => {
    if (params === null || typeof params !== 'object') {
      throw new Error('Invalid parameters for downloading chapter')
    }

    if (!('chapterId' in params) || typeof params.chapterId !== 'string') {
      throw new Error('Missing or invalid chapterId')
    }

    if (!('mangaId' in params) || typeof params.mangaId !== 'string') {
      throw new Error('Missing or invalid mangaId')
    }

    if (!('language' in params) || typeof params.language !== 'string') {
      throw new Error('Missing or invalid language')
    }

    if (!('quality' in params) || typeof params.quality !== 'string') {
      throw new Error('Missing or invalid quality')
    }

    const options: DownloadChapterOptions = {
      chapterId: params.chapterId,
      mangaId: params.mangaId,
      language: params.language,
      quality: params.quality as ImageQuality
    }

    return await downloadService.downloadChapter(options)
  })

  wrapIpcHandler('downloads:delete-chapter', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for deleting chapter')
    }

    await downloadService.deleteChapter(chapterId)
  })

  wrapIpcHandler('download:get-all-downloads', async () => {
    return downloadService.getAllDownloads()
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
}
