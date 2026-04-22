import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { CreateCollectionCommand } from '../../database/commands/collections/create-collection.command'
import { RemoveFromCollectionCommand } from '../../database/commands/collections/remove-from-collection.command'
import { ReorderMangaInCollectionCommand } from '../../database/commands/collections/reorder-manga-collection.command'
import { UpdateCollectionCommand } from '../../database/commands/collections/update-collection.command'
import { UpsertMangaCommand } from '../../database/commands/manga/upsert-manga.command'
import { RecordReadCommand } from '../../database/commands/history/record-read.command'
import { GetLibraryMangaCommand } from '../../database/commands/manga/get-library-manga.command'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { readHistoryRepo } from '../../database/repositories/read-history.repo'
import { updateCheckerService } from '../../services/update-checker.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerLibraryHandlers(): void {
  /**
   * Get library manga with filtering and sorting.
   *
   * Retrieves favorited manga from library with optional filters (tags, status, etc.)
   * and sorting. Returns paginated results. Main data source for LibraryView grid.
   *
   * @param options - Query options object
   * @param options.sortBy - Sort field: 'title' | 'updatedAt' | 'addedAt'
   * @param options.sortOrder - 'asc' | 'desc'
   * @param options.filters - Filter criteria (tags, content rating, status)
   * @param options.limit - Results per page
   * @param options.offset - Pagination offset
   * @returns Promise<Array<Manga>> - Library manga matching criteria
   *
   * @example
   * // Get library sorted by recent updates
   * const manga = await window.api.getLibraryManga({
   *   sortBy: 'updatedAt',
   *   sortOrder: 'desc',
   *   limit: 50,
   *   offset: 0
   * })
   */
  wrapIpcHandler('library:get-manga', async (_, options: unknown) => {
    return mangaRepo.getLibraryManga(options as GetLibraryMangaCommand)
  })

  /**
   * Get manga details by ID.
   *
   * Retrieves full manga metadata (title, description, tags, authors, etc.) from
   * local cache. Returns null if not cached. Used in MangaDetails page.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<Manga | null> - Manga object or null if not found
   *
   * @example
   * // Load manga details
   * const manga = await window.api.getMangaById('xyz789...')
   * if (manga) console.log(manga.title)
   */
  wrapIpcHandler('library:get-manga-by-id', async (_, mangaId: unknown) => {
    return mangaRepo.getMangaById(mangaId as string)
  })

  /**
   * Get cached chapters for a manga.
   *
   * Retrieves chapter list from local database cache (not live API). Used to quickly
   * display chapter list without API call. May be stale - use check-for-updates to refresh.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<Array<Chapter>> - Cached chapter list
   *
   * @example
   * // Load chapters from cache
   * const chapters = await window.api.getCachedChapters('xyz789...')
   */
  wrapIpcHandler('library:get-cached-chapters', async (_, mangaId: unknown) => {
    return chapterRepo.getChaptersByMangaId(mangaId as string)
  })

  /**
   * Toggle favorite status for a manga.
   *
   * Adds manga to library if not favorited, removes from library if already favorited.
   * When unfavoriting, downloaded chapters are NOT deleted (use delete-manga-downloads separately).
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<{favorited: boolean}> - New favorite status
   *
   * @example
   * // Toggle favorite
   * const result = await window.api.toggleFavorite('xyz789...')
   * console.log(result.favorited ? 'Added to library' : 'Removed from library')
   */
  wrapIpcHandler('library:toggle-favourite', async (_, mangaId: string) => {
    return mangaRepo.toggleFavourite(mangaId)
  })

  /**
   * Upsert manga metadata into cache.
   *
   * Inserts or updates manga metadata in local database. Used when fetching manga
   * details from API to cache locally. Merge strategy: updates existing fields,
   * preserves favorite status.
   *
   * @param command - Manga metadata object
   * @param command.id - MangaDex manga UUID
   * @param command.title - Manga title
   * @param command.description - Synopsis
   * @param command.tags - Array of tag IDs
   * @param command.authors - Author names
   * @param command.coverUrl - Cover image URL
   * @returns Promise<void>
   *
   * @example
   * // Cache manga metadata
   * await window.api.upsertManga({
   *   id: 'xyz789...',
   *   title: 'Sample Manga',
   *   description: '...',
   *   tags: [...],
   *   authors: ['Author Name'],
   *   coverUrl: 'https://...'
   * })
   */
  wrapIpcHandler('library:upsert-manga', async (_, command: unknown) => {
    return mangaRepo.upsertManga(command as UpsertMangaCommand)
  })

  /**
   * Check for new chapters for library manga.
   *
   * Queries MangaDex API to check if specified manga have new chapters since last check.
   * Updates chapter cache and returns list of manga with new chapters. Used for update
   * notifications and library refresh.
   *
   * @param mangaIds - Array of MangaDex manga UUIDs to check
   * @returns Promise<Array<{mangaId: string, newChapterCount: number}>> - Update results
   *
   * @example
   * // Check for updates (all library)
   * const updates = await window.api.checkForUpdates(libraryMangaIds)
   * updates.forEach(u => console.log(`${u.mangaId}: ${u.newChapterCount} new chapters`))
   */
  wrapIpcHandler('library:check-for-updates', async (_, mangaIds: unknown) => {
    return updateCheckerService.checkForUpdates(mangaIds as string[])
  })

  /**
   * Get library manga that have unread new chapters.
   *
   * Returns favorited manga that have chapters newer than last read timestamp.
   * Used in Updates view to show manga with new content.
   *
   * @returns Promise<Array<Manga & {newChapterCount: number}>> - Manga with new chapters
   *
   * @example
   * // Show updates view
   * const mangaWithUpdates = await window.api.getMangaWithUpdates()
   * console.log(`${mangaWithUpdates.length} manga have new chapters`)
   */
  wrapIpcHandler('library:get-manga-with-updates', async () => {
    return mangaRepo.getLibraryMangaWithNewChapters()
  })

  /**
   * Get manga that have downloaded chapters.
   *
   * Returns list of manga that have at least one downloaded chapter. Used in
   * DownloadsView to show downloaded manga grid.
   *
   * @returns Promise<Array<Manga & {downloadedChapterCount: number}>> - Manga with downloads
   *
   * @example
   * // Show downloaded manga
   * const downloadedManga = await window.api.getDownloadedManga()
   */
  wrapIpcHandler('library:get-downloaded-manga', async () => {
    return mangaRepo.getDownloadedManga()
  })

  /**
   * Get all collections.
   *
   * Retrieves all user-created manga collections (custom reading lists). Returns
   * collection metadata (name, description, manga count). Used in Collections sidebar.
   *
   * @returns Promise<Array<Collection>> - All collections
   *
   * @example
   * // Show collections list
   * const collections = await window.api.getAllCollections()
   * collections.forEach(c => console.log(`${c.name}: ${c.mangaCount} manga`))
   */
  wrapIpcHandler('collections:get-all', async () => {
    return collectionRepo.getAllCollections()
  })

  /**
   * Get manga in a specific collection.
   *
   * Retrieves manga belonging to a collection with custom sort order. Used in
   * CollectionView to display collection contents.
   *
   * @param collectionId - Collection database ID (auto-increment, not UUID)
   * @returns Promise<Array<Manga>> - Manga in collection (sorted by custom order)
   *
   * @example
   * // Show collection contents
   * const manga = await window.api.getCollectionManga(5)
   */
  wrapIpcHandler('collections:get-manga', async (_, collectionId: unknown) => {
    return collectionRepo.getMangaInCollection(collectionId as number)
  })

  /**
   * Get collections that contain a specific manga.
   *
   * Returns list of collections a manga belongs to. Used to show collection badges
   * in MangaDetails and allow quick add/remove.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<Array<Collection>> - Collections containing this manga
   *
   * @example
   * // Show which collections manga belongs to
   * const collections = await window.api.getCollectionsByManga('xyz789...')
   * console.log(`In ${collections.length} collections`)
   */
  wrapIpcHandler('collections:get-by-manga', async (_, mangaId: unknown) => {
    return collectionRepo.getCollectionByManga(mangaId as string)
  })

  /**
   * Create a new collection.
   *
   * Creates empty manga collection with name and optional description.
   * Returns collection ID for subsequent operations.
   *
   * @param command - Collection metadata
   * @param command.name - Collection name (required)
   * @param command.description - Optional description
   * @returns Promise<{id: number}> - New collection ID
   *
   * @example
   * // Create collection
   * const result = await window.api.createCollection({
   *   name: 'Favorites',
   *   description: 'My top picks'
   * })
   * console.log(`Created collection ${result.id}`)
   */
  wrapIpcHandler('collections:create', async (_, command: unknown) => {
    return collectionRepo.createCollection(command as CreateCollectionCommand)
  })

  /**
   * Update collection metadata.
   *
   * Updates collection name and/or description. Does not affect manga membership.
   *
   * @param command - Update data
   * @param command.id - Collection ID
   * @param command.name - New name (optional)
   * @param command.description - New description (optional)
   * @returns Promise<void>
   *
   * @example
   * // Rename collection
   * await window.api.updateCollection({
   *   id: 5,
   *   name: 'Top Picks',
   *   description: 'Updated description'
   * })
   */
  wrapIpcHandler('collections:update', async (_, command: unknown) => {
    return collectionRepo.updateCollection(command as UpdateCollectionCommand)
  })

  /**
   * Delete a collection.
   *
   * Permanently removes collection and all manga associations. Manga themselves
   * are NOT deleted (remain in library). Cannot be undone.
   *
   * @param collectionId - Collection database ID
   * @returns Promise<void>
   *
   * @example
   * // Delete collection
   * await window.api.deleteCollection(5)
   */
  wrapIpcHandler('collections:delete', async (_, collectionId: unknown) => {
    return collectionRepo.deleteCollection(collectionId as number)
  })

  /**
   * Add manga to a collection.
   *
   * Adds one or more manga to collection. Manga are appended to end of custom sort order.
   * Silently ignores duplicates.
   *
   * @param command - Add operation data
   * @param command.collectionId - Collection ID
   * @param command.mangaIds - Array of manga UUIDs to add
   * @returns Promise<void>
   *
   * @example
   * // Add manga to collection
   * await window.api.addMangaToCollection({
   *   collectionId: 5,
   *   mangaIds: ['xyz789...', 'abc123...']
   * })
   */
  wrapIpcHandler('collections:add-manga', async (_, command: unknown) => {
    return collectionRepo.addToCollection(command as AddToCollectionCommand)
  })

  /**
   * Remove manga from collection(s).
   *
   * Removes manga from one or more collections. Accepts array of remove commands
   * for batch operations (e.g., remove manga from multiple collections).
   *
   * @param command - Array of remove operations
   * @param command[].collectionId - Collection ID
   * @param command[].mangaId - Manga UUID to remove
   * @returns Promise<void>
   *
   * @example
   * // Remove manga from collection
   * await window.api.removeMangaFromCollection([
   *   {collectionId: 5, mangaId: 'xyz789...'}
   * ])
   */
  wrapIpcHandler('collections:remove-manga', async (_, command: unknown) => {
    return collectionRepo.removeFromCollection(command as RemoveFromCollectionCommand[])
  })

  /**
   * Reorder manga within a collection.
   *
   * Updates custom sort order for manga in collection. Used for drag-and-drop reordering.
   *
   * @param command - Reorder operation
   * @param command.collectionId - Collection ID
   * @param command.mangaIds - Array of manga UUIDs in new order
   * @returns Promise<void>
   *
   * @example
   * // Reorder manga (drag-and-drop)
   * await window.api.reorderCollectionManga({
   *   collectionId: 5,
   *   mangaIds: ['id3...', 'id1...', 'id2...'] // New order
   * })
   */
  wrapIpcHandler('collections:reorder', async (_, command: unknown) => {
    return collectionRepo.reorderMangaInCollection(command as ReorderMangaInCollectionCommand)
  })

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
    return readHistoryRepo.getRecentlyRead(limit as number)
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
    return readHistoryRepo.recordRead(command as RecordReadCommand)
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
