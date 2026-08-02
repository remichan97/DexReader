import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { readingRepo } from '../../database/repositories/reading-stats.repo'
import { wrapIpcHandler } from '../wrap-handler'

export function registerProgressTrackingHandlers(): void {
  /**
   * Get reading progress for a specific manga.
   *
   * Returns the last read chapter and page number for tracking resume position.
   * Returns null if manga has never been read.
   *
   * @param id - MangaDex manga UUID
   * @returns Promise<{chapterId: string, page: number, lastReadAt: Date} | null> - Progress data or null if no progress
   *
   * @example
   * // Check resume position
   * const progress = await window.api.getProgress('abc123-def456...')
   * if (progress) {
   *   console.log(`Resume from chapter ${progress.chapterId}, page ${progress.page}`)
   * }
   */
  wrapIpcHandler('progress:get-progress', async (_, id: unknown) => {
    return progressRepo.getProgressByMangaId(id as string)
  })

  /**
   * Save reading progress for one or more chapters.
   *
   * Updates the last read position for chapters. Accepts multiple progress updates
   * in a single call for batch operations (e.g., marking multiple chapters as read).
   *
   * @param progressData - Array of progress updates with mangaId, chapterId, page, and timestamp
   * @returns Promise<void>
   *
   * @example
   * // Save progress on page turn
   * await window.api.saveProgress([{
   *   mangaId: 'abc123-def456...',
   *   chapterId: 'xyz789-uvw012...',
   *   page: 15,
   *   readAt: new Date()
   * }])
   */
  wrapIpcHandler('progress:save-progress', async (_, progressData: unknown) => {
    return progressRepo.saveProgress(progressData as SaveProgressCommand[])
  })

  /**
   * Delete all reading progress for a manga.
   *
   * Removes all progress tracking data for a manga. Used when removing manga
   * from library or resetting reading history.
   *
   * @param id - MangaDex manga UUID
   * @returns Promise<void>
   *
   * @example
   * // Clear progress when unfavouriting
   * await window.api.deleteProgress('abc123-def456...')
   */
  wrapIpcHandler('progress:delete-progress', async (_, id: unknown) => {
    return progressRepo.deleteProgress(id as string)
  })

  /**
   * Get overall reading statistics.
   *
   * Returns aggregate stats about reading activity: total chapters read,
   * reading time, manga count, etc. Used for statistics dashboard.
   *
   * @returns Promise<{totalChaptersRead: number, totalManga: number, ...}> - Reading statistics
   *
   * @example
   * // Display reading stats
   * const stats = await window.api.getReadingStatistics()
   * console.log(`You've read ${stats.totalChaptersRead} chapters!`)
   */
  wrapIpcHandler('progress:get-statistics', async () => {
    return readingRepo.getStats()
  })

  /**
   * Get reading progress for all manga with metadata.
   *
   * Returns progress data with manga titles and cover images for displaying
   * reading history or "Continue Reading" lists.
   *
   * @returns Promise<Array<{mangaId: string, title: string, coverUrl: string, progress: {...}}>> - Progress with manga metadata
   *
   * @example
   * // Build "Continue Reading" list
   * const allProgress = await window.api.getAllProgress()
   * allProgress.forEach(item => {
   *   console.log(`${item.title}: Ch ${item.progress.chapterId}, pg ${item.progress.page}`)
   * })
   */
  wrapIpcHandler('progress:get-all-progress', async () => {
    return progressRepo.getAllProgressWithMetadata()
  })

  /**
   * Get reading progress for a specific chapter.
   *
   * Returns the last page read in a specific chapter. Null if chapter hasn't been started.
   *
   * @param params - Object containing mangaId and chapterId
   * @returns Promise<{page: number, lastReadAt: Date} | null> - Chapter progress or null
   *
   * @example
   * // Check if chapter is partially read
   * const chapterProgress = await window.api.getChapterProgress({
   *   mangaId: 'abc123...',
   *   chapterId: 'xyz789...'
   * })
   */
  wrapIpcHandler('progress:get-chapter-progress', async (_, params: unknown) => {
    const { mangaId, chapterId } = params as { mangaId: string; chapterId: string }
    return progressRepo.getChapterProgress(mangaId, chapterId)
  })

  /**
   * Get reading progress for all chapters in a manga.
   *
   * Returns progress data for every chapter in a manga that has been read.
   * Useful for displaying read/unread indicators in chapter lists.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<Array<{chapterId: string, page: number, completed: boolean}>> - Progress for all chapters
   *
   * @example
   * // Mark read chapters in UI
   * const chapterProgress = await window.api.getAllChapterProgress('abc123...')
   * chapterProgress.forEach(prog => {
   *   if (prog.completed) markAsRead(prog.chapterId)
   * })
   */
  wrapIpcHandler('progress:get-all-chapter-progress', async (_, mangaId: unknown) => {
    return progressRepo.getAllChapterProgress(mangaId as string)
  })

  /**
   * Save chapter metadata to database for caching.
   *
   * Caches chapter information (title, number, scanlation group) to reduce API calls.
   * Called when displaying manga details or after fetching chapter lists.
   *
   * @param chapters - Array of chapter objects with MangaDex metadata
   * @returns Promise<void>
   *
   * @example
   * // Cache chapters after API fetch
   * await window.api.saveChapters([
   *   {
   *     chapterId: 'xyz789...',
   *     mangaId: 'abc123...',
   *     title: 'Chapter Title',
   *     chapterNumber: '1',
   *     language: 'en',
   *     publishAt: new Date(),
   *     scanlationGroup: 'Group Name'
   *   }
   * ])
   */
  wrapIpcHandler('progress:save-chapters', async (_, chapters: unknown) => {
    return chapterRepo.saveChapters(
      chapters as Array<{
        chapterId: string
        mangaId: string
        title?: string
        chapterNumber?: string
        volume?: string
        language: string
        publishAt: Date
        scanlationGroup?: string
        externalUrl?: string
      }>
    )
  })
}
