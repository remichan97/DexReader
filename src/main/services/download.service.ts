import { DeleteChapterCommand } from './../database/commands/chapter-downloads/delete-chapter.command'
import { ChapterDownloadsEvent } from './events/chapter-downloads.event'
import { ImageQuality } from '../api/enums'
import { MangaDexClient } from '../api/mangadexClient'
import { MarkDownloadStateCommand } from '../database/commands/chapter-downloads/mark-state.command'
import { DownloadStatus } from '../database/enums/download-status.enum'
import { ChapterWithMetadata } from '../database/queries/manga/chapter-with-metadata.query'
import { chapterDownloadsRepo } from '../database/repository/chapter-downloads.repo'
import { chapterRepo } from '../database/repository/chapter.repo'
import { getDownloadsPath } from '../filesystem/pathValidator'
import { secureFs } from '../filesystem/secureFs'
import { downloadData } from './helpers/dexreader-download.helper'
import { DownloadChapterOptions } from './options/download-chapter.option'
import { DownloadChapterResult } from './results/dexreader/download-chapter.result'
import path from 'node:path'

import { BrowserWindow } from 'electron'
import { ChapterDownloadQuery } from '../database/queries/chapter-downloads/chapter-downloads.query'
import { MangaStorageQuery } from '../database/queries/chapter-downloads/manga-storage.query'
import { DiskSpaceData } from './data/disk-space.data'
import { getSettingByPath } from '../settings/settingsManager'
import { StorageData } from './data/storage.data'
import { DeleteMangaResult } from './results/dexreader/delete-manga.result'

export class NativeDownloadService {
  private readonly mangadexClient = new MangaDexClient()

  isDownloaded(chapterId: string): ChapterDownloadQuery | undefined {
    return chapterDownloadsRepo.getDownload(chapterId)
  }

  getAllDownloads(): ChapterDownloadQuery[] {
    return chapterDownloadsRepo.getAllDownloads()
  }

  async getStorageInfo(): Promise<StorageData> {
    return {
      mangaStorage: this.getMangaStorage(),
      diskSpace: await this.getDiskSpaceInfo()
    }
  }

  async downloadChapter(options: DownloadChapterOptions): Promise<DownloadChapterResult> {
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

    let chapterMetadata: ChapterWithMetadata | undefined = chapterRepo.getChapterById(
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

  async deleteChapter(chapterId: string): Promise<void> {
    const download = chapterDownloadsRepo.getDownload(chapterId)

    if (!download) {
      throw new Error(`No download found for chapter ID ${chapterId}`)
    }

    // Build full path from stored base path and relative path
    const fullPath = path.join(download.downloadsBasePath, download.filePath)

    // Request the filesystem to delete the chapter files
    try {
      await secureFs.deleteDir(fullPath)
    } catch (error) {
      console.error(`Failed to delete chapter files at ${fullPath}:`, error)
      throw new Error(`Failed to delete chapter files: ${error}`)
    }

    // Update the database to reflect the deletion (permanent delete)
    chapterDownloadsRepo.deleteDownload({
      chapterId,
      isDeletePermanent: true
    })
  }

  // Delete all chapters of a manga, use for single deletion
  async deleteManga(mangaId: string): Promise<DeleteMangaResult> {
    const downloadsToBeDeleted = this.getDownloadByMangaId(mangaId)
    const successfulDeletions: DeleteChapterCommand[] = []
    const result: DeleteMangaResult = {
      success: false,
      successfulCount: 0,
      failedCount: 0,
      failedChapters: []
    }

    // Begin by deleting all chapters of the manga
    for (const download of downloadsToBeDeleted) {
      const fullPath = path.join(download.downloadsBasePath, download.filePath)
      try {
        await secureFs.deleteDir(fullPath, { recursive: true })
        successfulDeletions.push({
          chapterId: download.chapterId,
          isDeletePermanent: true
        })
        result.successfulCount += 1
      } catch (error) {
        console.error(`Failed to delete chapter files at ${fullPath}:`, error)
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

    completedDownloads.forEach((download) => {
      chapterDownloadsRepo.deleteDownload({
        chapterId: download.chapterId,
        isDeletePermanent: false // Soft delete - hide from UI but keep files
      })
    })

    return completedDownloads.length
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

    const chapterData = await this.mangadexClient.getChapterImages(chapterId, quality)

    for (const [index, imageData] of chapterData.entries()) {
      // Download each image and save to downloadPath
      try {
        const downloadResult = await downloadData(imageData.url, downloadPath, index + 1)
        updateData.storageSize += downloadResult.size
        updateData.totalPages += 1

        // Capture the image format from the first image
        if (index === 0) {
          updateData.imageFormat = downloadResult.format
        }
      } catch (error) {
        console.error(`Failed to download image ${imageData.url}:`, error)
        // Tell the upstream that the download failed
        chapterDownloadsRepo.markDownloadState({
          chapterId: chapterId,
          isFailed: true,
          errorMessage: `Failed to download image ${imageData.url}: ${error}`,
          storageSize: 0,
          totalPages: 0
        })

        await secureFs.deleteDir(downloadPath).catch((err) => {
          console.error(`Failed to clean up after failed download at ${downloadPath}:`, err)
        })

        throw error
      }

      // Let the UI know about the progress after each image is downloaded
      this.emitProgress({
        chapterId: chapterId,
        totalPages: updateData.totalPages,
        percentage:
          updateData.totalPages > 0
            ? Math.round((updateData.totalPages / chapterData.length) * 100)
            : 0,
        currentPage: updateData.totalPages,
        status:
          index === chapterData.length - 1 ? DownloadStatus.Completed : DownloadStatus.Downloading,
        bytesDownloaded: updateData.storageSize
      })
    }

    // Mark as successfully downloaded before returning
    updateData.isDownloaded = true
    return updateData
  }

  private getMangaStorage(): MangaStorageQuery {
    return chapterDownloadsRepo.getStorageByManga()
  }

  private async getDiskSpaceInfo(): Promise<DiskSpaceData> {
    const downloadsPath = (await getSettingByPath('downloads', 'downloadPath')) as string

    const stats = await secureFs.statFs(downloadsPath)

    return {
      total: stats.blocks * stats.bsize,
      free: stats.bfree * stats.bsize,
      used: (stats.blocks - stats.bfree) * stats.bsize
    }
  }

  private getDownloadByMangaId(mangaId: string): ChapterDownloadQuery[] {
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
export const downloadService = new NativeDownloadService()
