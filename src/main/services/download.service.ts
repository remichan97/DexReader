import { DeleteChapterCommand } from '@shared/commands/repositories/chapter-downloads/delete-chapter.command'
import { ChapterDownloadsEvent } from '../../shared/events/chapter-downloads.event'
import { ImageQuality } from '../api/enums'
import { MangaDexClient } from '../api/mangadex-client'
import { MarkDownloadStateCommand } from '@shared/commands/repositories/chapter-downloads/mark-state.command'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ChapterWithMetadataContract } from '@shared/contracts/database/manga/chapter-with-metadata.contract'
import { chapterDownloadsRepo } from '../database/repositories/chapter-downloads.repo'
import { chapterRepo } from '../database/repositories/chapter.repo'
import { getDownloadsPath } from '../filesystem/path-validator'
import { secureFs } from '../filesystem/secure-fs'
import { downloadData } from './helpers/dexreader-download.helper'
import path from 'node:path'

import { BrowserWindow } from 'electron'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { MangaStorageContract } from '@shared/contracts/database/chapter-downloads/manga-storage.contract'
import { StorageDataContract } from '../../shared/contracts/storage/storage-data.contract'
import { diskCacheUtil } from '../api/utils/disk-cache.util'
import { ImageUrlResponse } from '../../shared/responses/image-url.response'
import { mainLog } from './logging/main-logging.service'
import { settingsManager } from '../settings/settings-manager'
import { DownloadChapterCommand } from '@shared/commands/services/download-chapter.command'
import { DownloadStatContract } from '@shared/contracts/services/dexreader/download-stats.contract'
import { DownloadChapterContract } from '@shared/contracts/services/dexreader/download-chapter.contract'
import { DeleteMangaContract } from '@shared/contracts/services/dexreader/delete-manga.contract'
import { DiskSpaceContract } from '@shared/contracts/storage/disk-space-data.contract'
import { DiskCacheContract } from '@shared/contracts/database/storage/disk-cache.contract'

interface ChapterImageCache {
  urls: ImageUrlResponse[]
  timestamp: number
}

class DownloadService {
  private readonly mangadexClient = new MangaDexClient()

  // Cache chapter image URLs for 5 minutes to avoid re-fetching on retry attempts
  // Image URLs from MangaDex are valid for 15+ minutes
  private readonly chapterImageCache = new Map<string, ChapterImageCache>()
  private readonly IMAGE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  isDownloaded(chapterId: string): ChapterDownloadContract | undefined {
    return chapterDownloadsRepo.getDownload(chapterId)
  }

  getAllDownloads(): ChapterDownloadContract[] {
    return chapterDownloadsRepo.getAllDownloads()
  }

  async getStorageInfo(): Promise<StorageDataContract> {
    return {
      mangaStorage: this.getMangaStorage(),
      diskSpace: await this.getDiskSpaceInfo(),
      cacheSize: await this.getDiskCacheSize()
    }
  }

  getDownloadStats(mangaId: string): DownloadStatContract {
    const downloads = this.getDownloadByMangaId(mangaId)

    const chapterCount = downloads.length
    const totalBytes = downloads.reduce((acc, download) => acc + (download.storageSize || 0), 0)

    return {
      chapterCount,
      totalBytes
    }
  }

  async downloadChapter(options: DownloadChapterCommand): Promise<DownloadChapterContract> {
    // make sure that we don't download something we already downloaded
    const isDownloaded = this.isDownloaded(options.chapterId)

    if (isDownloaded) {
      return {
        chapterId: options.chapterId,
        success: isDownloaded.status === DownloadStatus.Completed,
        totalPages: isDownloaded.totalPages || 0,
        storageSize: isDownloaded.storageSize || 0,
        filePath: path.join(isDownloaded.downloadsBasePath, isDownloaded.filePath)
      }
    }

    // Get downloads base path (where files should be stored)
    const downloadsBasePath = getDownloadsPath()

    // Collect chapter data from either database cache, or API

    let chapterMetadata: ChapterWithMetadataContract | undefined = chapterRepo.getChapterById(
      options.chapterId
    )

    if (!chapterMetadata) {
      // We have no cache of this chapter, we'll have to use API for this
      const response = await this.mangadexClient.getChapter(options.chapterId, ['scanlation_group'])

      // If API fail us, bail out
      if (response.result === 'error') {
        throw new Error(`Failed to fetch chapter metadata: ${response.result}`)
      }

      const scanlatorGroup = response.data.relationships.find(
        (rel) => rel.type === 'scanlation_group'
      )

      chapterMetadata = {
        chapterId: response.data.id,
        mangaId: options.mangaId,
        title: response.data.attributes.title,
        chapterNumber: response.data.attributes.chapter,
        volume: response.data.attributes.volume,
        language: options.language,
        publishedAt: new Date(response.data.attributes.publishAt),
        createdAt: new Date(response.data.attributes.createdAt),
        updatedAt: new Date(response.data.attributes.updatedAt),
        scanlatorGroup: scanlatorGroup ? (scanlatorGroup.attributes?.name as string) : undefined
      }
    }

    // We got all we need, start downloading
    chapterRepo.saveChapters([
      {
        chapterId: chapterMetadata.chapterId,
        mangaId: chapterMetadata.mangaId,
        title: chapterMetadata.title,
        chapterNumber: chapterMetadata.chapterNumber,
        volume: chapterMetadata.volume,
        language: chapterMetadata.language,
        publishAt: chapterMetadata.publishedAt,
        externalUrl: chapterMetadata.externalUrl,
        scanlationGroup: chapterMetadata.scanlatorGroup
      }
    ])

    // Build relative path (stored in database for portability)
    const relativePath = path.join(
      'manga',
      chapterMetadata.mangaId,
      'chapters',
      chapterMetadata.chapterId
    )

    // Build full filesystem path (for actual file operations)
    const fullPath = path.join(downloadsBasePath, relativePath, 'pages')

    // Ensure directory exists
    await secureFs.ensureDir(fullPath)

    chapterDownloadsRepo.createDownload({
      chapterId: chapterMetadata.chapterId,
      mangaId: chapterMetadata.mangaId,
      downloadsBasePath: downloadsBasePath,
      filePath: relativePath,
      totalPages: 0, // to be updated after download
      imageQuality: options.quality
    })

    const downloadStats = await this.downloadChapterImages(
      fullPath,
      chapterMetadata.chapterId,
      options.quality
    )

    chapterDownloadsRepo.markDownloadState(downloadStats)

    return {
      chapterId: chapterMetadata.chapterId,
      success: true,
      totalPages: downloadStats.totalPages || 0,
      storageSize: downloadStats.storageSize || 0,
      filePath: path.join(downloadsBasePath, relativePath)
    }
  }

  async deleteChapter(options: DeleteChapterCommand): Promise<void> {
    const download = chapterDownloadsRepo.getDownload(options.chapterId)

    if (!download) {
      throw new Error(`No download found for chapter ID ${options.chapterId}`)
    }

    // Request the filesystem to delete the chapter files if this is a permanent delete, otherwise just mark as deleted in the database
    if (options.isDeletePermanent) {
      try {
        // Build full path from stored base path and relative path
        const fullPath = path.join(download.downloadsBasePath, download.filePath)
        await secureFs.deleteDir(fullPath)
      } catch (error) {
        mainLog.error(`[DownloadService] Failed to delete chapter files:`, error)
        throw new Error(`Failed to delete chapter files: ${error}`)
      }
    }

    // Update the database to reflect the deletion (either soft delete or permanent delete)
    chapterDownloadsRepo.deleteDownload({
      chapterId: options.chapterId,
      isDeletePermanent: !!options.isDeletePermanent
    })

    mainLog.info(
      `[DownloadService] Successfully ` +
        (options.isDeletePermanent ? 'deleted ' : 'hid ') +
        `chapter ${options.chapterId}`
    )
  }

  // Delete all chapters of a manga, use for single deletion
  async deleteManga(mangaId: string): Promise<DeleteMangaContract> {
    const downloadsToBeDeleted = this.getDownloadByMangaId(mangaId)
    const successfulDeletions: DeleteChapterCommand[] = []
    const result: DeleteMangaContract = {
      success: false,
      successfulCount: 0,
      failedCount: 0,
      failedChapters: []
    }

    // Begin by deleting all chapters of the manga
    for (const download of downloadsToBeDeleted) {
      const fullPath = path.join(download.downloadsBasePath, download.filePath)
      try {
        await secureFs.deleteDir(fullPath)
        successfulDeletions.push({
          chapterId: download.chapterId,
          isDeletePermanent: true
        })
        result.successfulCount += 1
      } catch (error) {
        mainLog.error(`[DownloadService] Failed to delete chapter files:`, error)
        result.failedCount += 1
        result.failedChapters.push(download.chapterId)
      }
    }

    // After attempting to delete all chapters, update the database for the successfully deleted ones
    if (successfulDeletions.length > 0) {
      chapterDownloadsRepo.batchDeleteDownloads(successfulDeletions)
    }

    //We've attempted all deletions, determine overall success
    result.success = result.failedCount === 0

    return result
  }

  async batchDeleteManga(mangaIds: string[]): Promise<void> {
    for (const mangaId of mangaIds) {
      await this.deleteManga(mangaId)
    }
  }

  // Clear completed downloads from UI (soft delete - files remain on disk)
  clearCompletedDownloads(): number {
    const allDownloads = chapterDownloadsRepo.getAllDownloads()
    const completedDownloads = allDownloads.filter((d) => d.status === DownloadStatus.Completed)
    const commands: DeleteChapterCommand[] = completedDownloads.map((download) => ({
      chapterId: download.chapterId,
      isDeletePermanent: false
    }))

    chapterDownloadsRepo.batchDeleteDownloads(commands)

    return completedDownloads.length
  }

  // I rather have this here, than exposing the proxy to the IPC layer just for this
  async emptyDiskCache(): Promise<void> {
    await diskCacheUtil.emptyDiskCoverCache()
  }

  private async downloadChapterImages(
    downloadPath: string,
    chapterId: string,
    quality: ImageQuality
  ): Promise<MarkDownloadStateCommand> {
    const updateData: MarkDownloadStateCommand = {
      chapterId: chapterId,
      storageSize: 0,
      totalPages: 0,
      isDownloaded: false
    }

    // Try to get chapter images from cache first to avoid redundant API calls on retries
    // Cache key includes quality since different qualities have different URLs
    const cacheKey = `${chapterId}:${quality}`
    const now = Date.now()
    const cached = this.chapterImageCache.get(cacheKey)

    let chapterData: ImageUrlResponse[]
    if (cached && now - cached.timestamp < this.IMAGE_CACHE_TTL) {
      chapterData = cached.urls
    } else {
      chapterData = await this.mangadexClient.getChapterImages(chapterId, quality)
      this.chapterImageCache.set(cacheKey, { urls: chapterData, timestamp: now })
    }

    updateData.totalPages = chapterData.length

    // Download pages in parallel batches of 5 for optimal performance
    // Based on benchmark testing, concurrency of 5 provides best throughput
    const CONCURRENCY = 5
    let pagesDownloaded = 0

    try {
      for (let i = 0; i < chapterData.length; i += CONCURRENCY) {
        const batch = chapterData.slice(i, Math.min(i + CONCURRENCY, chapterData.length))

        // Download all pages in the batch concurrently
        const batchResults = await Promise.all(
          batch.map((imageData, batchIndex) => {
            const pageNumber = i + batchIndex + 1
            return downloadData(imageData.url, downloadPath, pageNumber)
          })
        )

        // Process batch results
        for (const [batchIndex, downloadResult] of batchResults.entries()) {
          updateData.storageSize += downloadResult.size

          // Capture the image format from the first image
          if (i === 0 && batchIndex === 0) {
            updateData.imageFormat = downloadResult.format
          }
        }

        pagesDownloaded += batch.length

        // Emit progress after each batch (not after each page)
        // This reduces IPC overhead while still providing responsive UI updates
        this.emitProgress({
          chapterId: chapterId,
          totalPages: updateData.totalPages,
          percentage: Math.round((pagesDownloaded / chapterData.length) * 100),
          currentPage: pagesDownloaded,
          status:
            pagesDownloaded === chapterData.length
              ? DownloadStatus.Completed
              : DownloadStatus.Downloading,
          bytesDownloaded: updateData.storageSize
        })
      }
    } catch (error) {
      mainLog.error(`[DownloadService] Failed to download chapter ${chapterId}:`, error)
      // Tell the upstream that the download failed
      chapterDownloadsRepo.markDownloadState({
        chapterId: chapterId,
        isFailed: true,
        errorMessage: `Failed to download chapter: ${error}`,
        storageSize: 0,
        totalPages: 0
      })

      await secureFs.deleteDir(downloadPath).catch((err) => {
        mainLog.error(
          `[DownloadService] Failed to clean up after failed download at ${downloadPath}:`,
          err
        )
      })

      throw error
    }

    // Mark as successfully downloaded before returning
    updateData.isDownloaded = true
    return updateData
  }

  private getMangaStorage(): MangaStorageContract {
    return chapterDownloadsRepo.getStorageByManga()
  }

  private async getDiskSpaceInfo(): Promise<DiskSpaceContract> {
    const downloadsPath =
      settingsManager.getByPath('downloads', 'downloadPath') ?? getDownloadsPath()

    const stats = await secureFs.statFs(downloadsPath)

    return {
      total: stats.blocks * stats.bsize,
      free: stats.bfree * stats.bsize,
      used: (stats.blocks - stats.bfree) * stats.bsize
    }
  }

  private async getDiskCacheSize(): Promise<DiskCacheContract> {
    return await diskCacheUtil.getDiskCacheSize()
  }

  private getDownloadByMangaId(mangaId: string): ChapterDownloadContract[] {
    return chapterDownloadsRepo.filterDownloadsByMangaId(mangaId)
  }

  private emitProgress(event: ChapterDownloadsEvent): void {
    // Pings the renderer process with the download progress of a chapter
    // This can be used to update the UI with the current download progress
    const browserWindow = BrowserWindow.getAllWindows()[0]
    if (browserWindow) {
      browserWindow.webContents.send('download:chapter-progress', event)
    }
  }
}
export const downloadService = new DownloadService()
