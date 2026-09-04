import { downloadService } from './../../services/download.service'
import { DownloadChapterCommand } from '@shared/commands/services/download-chapter.command'
import { wrapIpcHandler } from '../wrap-handler'
import { isDownloadChapterOptions } from '../../settings/validators/command.validator'
import { mainLog } from '../../services/logging/main-logging.service'
import { DeleteChapterCommand } from '@shared/commands/services/delete-chapter.command'

export function registerDownloadHandlers(): void {
  /**
   * Download a manga chapter for offline reading.
   *
   * Queues a chapter for download with specified language and image quality.
   * Download proceeds asynchronously in background. Progress events emitted via IPC.
   * Downloaded chapters are saved to user-configured downloads directory and accessible
   * via local-manga:// protocol.
   *
   * @param params - Download configuration object
   * @param params.chapterId - MangaDex chapter UUID
   * @param params.mangaId - MangaDex manga UUID (for organizing downloads by series)
   * @param params.language - Chapter language code (e.g., 'en', 'ja')
   * @param params.quality - Image quality: 'data' (original) or 'data-saver' (compressed ~60% size)
   * @returns Promise<void> - Resolves when download is queued (not completed)
   * @throws {TypeError} - If params object is invalid or missing required fields
   *
   * @example
   * // Download English chapter at original quality
   * await window.api.downloadChapter({
   *   chapterId: 'abc123-def456...',
   *   mangaId: 'xyz789-uvw012...',
   *   language: 'en',
   *   quality: 'data'
   * })
   */
  wrapIpcHandler('download:download-chapter', async (_, params: unknown) => {
    isDownloadChapterOptions(params)

    if (!isDownloadChapterOptions(params)) {
      mainLog.warn('[Downloads] Invalid download chapter options')
      throw new TypeError('Invalid parameters for downloading chapter')
    }

    const options: DownloadChapterCommand = {
      chapterId: params.chapterId,
      mangaId: params.mangaId,
      language: params.language,
      quality: params.quality
    }

    mainLog.info(`[Downloads] Chapter download requested: ${options.chapterId}`)
    return await downloadService.downloadChapter(options)
  })

  /**
   * Delete a downloaded chapter.
   *
   * Permanently deletes, or hides (soft delete), a downloaded chapter based on options. Permanent delete removes files from disk and database record. Soft delete keeps files but marks as hidden in database, effectively hides the chapter from the DownloadsView. Used in DownloadsView for managing downloaded chapters.
   *
   * @param options - Delete configuration object
   * @param options.chapterId - MangaDex chapter UUID
   * @param options.isDeletePermanent - Whether to permanently delete files (true) or just mark as deleted in database (false)
   * @returns Promise<void>
   * @throws {TypeError} - If options object is invalid or missing required fields
   *
   * @example
   * // Permanently delete a downloaded chapter
   * await window.api.deleteDownloadedChapter({ chapterId: 'abc123-def456...', isDeletePermanent: true })
   */
  wrapIpcHandler('download:delete-chapter', async (_, options: unknown) => {
    if (typeof options !== 'object' || options === null || !('chapterId' in options)) {
      throw new TypeError('Invalid options for deleting chapter')
    }

    const deleteOptions = options as DeleteChapterCommand

    mainLog.info(`[Downloads] Chapter deletion requested: ${deleteOptions.chapterId}`)
    return await downloadService.deleteChapter(deleteOptions)
  })

  /**
   * Get all downloaded chapters across all manga.
   *
   * Returns list of all chapters currently downloaded with metadata. Used in
   * DownloadsView to display active and completed downloads.
   *
   * @returns Promise<Array<{chapterId: string, mangaId: string, status: string, progress: number, ...}>> - All downloads with status and progress
   *
   * @example
   * // Get all downloads for display
   * const downloads = await window.api.getAllDownloads()
   * downloads.forEach(d => console.log(`${d.mangaId}: ${d.status} ${d.progress}%`))\n   */
  wrapIpcHandler('download:get-all-downloads', async () => {
    return downloadService.getAllDownloads()
  })

  /**
   * Clear completed downloads from the database.
   *
   * Removes download records with status 'completed' from chapter_downloads table.
   * Downloaded files remain on disk. Used to clean up completed entries from DownloadsView.
   *
   * @returns Promise<void>
   *
   * @example
   * // Clear completed downloads list
   * await window.api.clearCompletedDownloads()
   */
  wrapIpcHandler('download:clear-completed', async () => {
    mainLog.info('[Downloads] Clear completed downloads requested')
    return downloadService.clearCompletedDownloads()
  })

  /**
   * Check if a specific chapter is downloaded.
   *
   * Returns download status and metadata for a chapter. Null if not downloaded.
   *
   * @param chapterId - MangaDex chapter UUID
   * @returns Promise<{downloaded: boolean, quality: string, ...} | null> - Download info or null
   * @throws {TypeError} - If chapterId is not a string
   *
   * @example
   * // Check if chapter is downloaded
   * const download = await window.api.getDownload('abc123...')
   * if (download) {
   *   console.log(`Downloaded at ${download.quality} quality`)
   * }
   */
  wrapIpcHandler('download:get-download', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for getting download')
    }

    return downloadService.isDownloaded(chapterId)
  })

  /**
   * Check if a chapter is downloaded (boolean).
   *
   * Simple boolean check for download status. Used in ChapterList to show download badges.
   *
   * @param chapterId - MangaDex chapter UUID
   * @returns Promise<boolean> - True if downloaded, false otherwise
   * @throws {TypeError} - If chapterId is not a string
   *
   * @example
   * // Show download badge
   * const isDownloaded = await window.api.isDownloaded('abc123...')
   * if (isDownloaded) showBadge()
   */
  wrapIpcHandler('download:is-downloaded', async (_, chapterId: unknown) => {
    if (typeof chapterId !== 'string') {
      throw new TypeError('Invalid chapterId for checking download')
    }

    return downloadService.isDownloaded(chapterId)
  })

  /**
   * Get storage statistics for all downloads.
   *
   * Returns total disk space used by downloaded manga chapters and breakdown by manga.
   * Used in Storage Management UI.
   *
   * @returns Promise<{totalSize: number, mangaBreakdown: Array<{mangaId: string, size: number}>}> - Storage info in bytes
   *
   * @example
   * // Display download storage usage
   * const stats = await window.api.getDownloadStorageStats()
   * console.log(`Total: ${stats.totalSize / 1024 / 1024} MB`)
   */
  wrapIpcHandler('download:storage-stats', async () => {
    return downloadService.getStorageInfo()
  })

  /**
   * Delete all downloaded chapters for a manga.
   *
   * Permanently removes all chapter downloads for a specific manga. Frees disk space.
   * Cannot be undone. Useful when removing manga from library.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<{deletedCount: number, freedSpace: number}> - Deletion result
   * @throws {TypeError} - If mangaId is invalid or empty
   *
   * @example
   * // Delete all chapters for manga
   * const result = await window.api.deleteMangaDownloads('xyz789...')
   * console.log(`Deleted ${result.deletedCount} chapters, freed ${result.freedSpace} bytes`)
   */
  wrapIpcHandler('download:delete-manga', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for deleting manga downloads')
    }

    if (!mangaId) {
      throw new TypeError('MangaId is required for deleting manga downloads')
    }

    mainLog.info(`[Downloads] Manga deletion requested: ${mangaId}`)
    return await downloadService.deleteManga(mangaId)
  })

  /**
   * Delete downloaded chapters for multiple manga (batch operation).
   *
   * Permanently removes all downloads for specified manga IDs. Batch version of
   * delete-manga for bulk cleanup operations.
   *
   * @param mangaIds - Array of MangaDex manga UUIDs
   * @returns Promise<{deletedCount: number, freedSpace: number}> - Batch deletion result
   * @throws {TypeError} - If mangaIds is not an array of strings or is empty
   *
   * @example
   * // Bulk delete downloads
   * const result = await window.api.batchDeleteMangaDownloads(['id1...', 'id2...'])
   * console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)
   */
  wrapIpcHandler('download:batch-delete-manga', async (_, mangaIds: unknown) => {
    if (!Array.isArray(mangaIds) || mangaIds.some((id) => typeof id !== 'string')) {
      throw new TypeError('Invalid mangaIds for batch deleting manga downloads')
    }

    mainLog.info(`[Downloads] Batch manga deletion requested: ${mangaIds.length} manga`)

    if (mangaIds.length === 0) {
      throw new TypeError('At least one mangaId is required for batch deleting manga downloads')
    }

    return await downloadService.batchDeleteManga(mangaIds)
  })

  /**
   * Clear cover image cache.
   *
   * Deletes all cached manga cover images from disk. Frees space but covers will
   * need to be re-downloaded on next view. Obeys cover cache limit settings.
   *
   * @returns Promise<{freedSpace: number}> - Amount of space freed in bytes
   *
   * @example
   * // Clear cover cache
   * const result = await window.api.clearCoverCache()
   * console.log(`Freed ${result.freedSpace / 1024 / 1024} MB`)
   */
  wrapIpcHandler('download:clear-cover-cache', async () => {
    return await downloadService.emptyDiskCache()
  })

  /**
   * Get download statistics for a specific manga.
   *
   * Returns download counts (total chapters, downloaded, in-progress) for a manga.
   * Used in MangaDetails to show download status summary.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<{totalChapters: number, downloaded: number, inProgress: number}> - Download stats
   * @throws {TypeError} - If mangaId is not a string
   *
   * @example
   * // Show manga download stats
   * const stats = await window.api.getDownloadStats('xyz789...')
   * console.log(`${stats.downloaded}/${stats.totalChapters} chapters downloaded`)
   */
  wrapIpcHandler('download:get-download-stats', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for getting download stats')
    }

    return downloadService.getDownloadStats(mangaId)
  })
}
