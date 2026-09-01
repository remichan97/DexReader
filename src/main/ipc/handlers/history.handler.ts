import { readHistoryRepo } from '../../database/repositories/read-history.repo'
import { wrapIpcHandler } from '../wrap-handler'
import { isRecordReadCommand } from '../../settings/validators/types.validator'

export function registerHistoryHandlers(): void {
  /**
   * Get full reading history.
   *
   * Retrieves all reading history entries sorted by most recent. Used in History view.
   *
   * @returns Promise<Array<HistoryEntry>> - All history entries
   *
   * @example
   * // Show reading history
   * const history = await window.api.getReadingHistory()
   * history.forEach(h => console.log(`${h.mangaTitle} - ${h.lastRead}`))
   */
  wrapIpcHandler('history:get-all', async () => {
    return readHistoryRepo.getHistory()
  })

  /**
   * Get recently read manga (limited).
   *
   * Returns most recent N manga from reading history. Used for "Continue Reading"
   * section on home page.
   *
   * @param limit - Number of recent manga to return
   * @returns Promise<Array<HistoryEntry>> - Recent history entries
   *
   * @example
   * // Show 10 most recent
   * const recent = await window.api.getRecentlyRead(10)
   */
  wrapIpcHandler('history:get-recently-read', async (_, limit: unknown) => {
    if (typeof limit !== 'number') {
      throw new TypeError('Invalid limit for getting recently read manga')
    }

    return readHistoryRepo.getRecentlyRead(limit)
  })

  /**
   * Record a chapter read event.
   *
   * Updates reading history and progress tracking when user reads a chapter.
   * Records timestamp, manga ID, chapter ID, and last page. Used for resume position
   * and history tracking.
   *
   * @param command - Read event data
   * @param command.mangaId - MangaDex manga UUID
   * @param command.chapterId - MangaDex chapter UUID
   * @param command.lastPage - Last page number read (0-indexed)
   * @returns Promise<void>
   *
   * @example
   * // Record chapter read
   * await window.api.recordRead({
   *   mangaId: 'xyz789...',
   *   chapterId: 'abc123...',
   *   lastPage: 15
   * })
   */
  wrapIpcHandler('history:record-read', async (_, command: unknown) => {
    if (!isRecordReadCommand(command)) {
      throw new TypeError('Invalid parameters for recording read')
    }

    return readHistoryRepo.recordRead(command)
  })

  /**
   * Clear all reading history.
   *
   * DESTRUCTIVE: Permanently deletes all reading history entries. Does NOT affect
   * reading progress (last read chapter/page). Cannot be undone. Used in privacy/cleanup.
   *
   * @returns Promise<void>
   *
   * @example
   * // Clear history (privacy)
   * await window.api.clearReadingHistory()
   */
  wrapIpcHandler('history:clear-history', async () => {
    return readHistoryRepo.clearAllHistory()
  })
}
