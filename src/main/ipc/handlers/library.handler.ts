import { mangaRepo } from '../../database/repositories/manga.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { wrapIpcHandler } from '../wrap-handler'
import {
  isGetLibraryMangaCommand,
  isUpsertMangaCommand
} from '../../settings/validators/command.validator'

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
    if (!isGetLibraryMangaCommand(options)) {
      throw new TypeError('Invalid parameters for getting library manga')
    }

    return mangaRepo.getLibraryManga(options)
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
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for getting manga by id')
    }

    return mangaRepo.getMangaById(mangaId)
  })

  /**
   * Get cached chapters for a manga.
   *
   * Retrieves chapter list from local database cache (not live API). Used to quickly
   * display chapter list without API call.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<Array<Chapter>> - Cached chapter list
   *
   * @example
   * // Load chapters from cache
   * const chapters = await window.api.getCachedChapters('xyz789...')
   */
  wrapIpcHandler('library:get-cached-chapters', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for getting cached chapters')
    }

    return chapterRepo.getChaptersByMangaId(mangaId)
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
  wrapIpcHandler('library:toggle-favourite', async (_, mangaId: unknown) => {
    if (typeof mangaId !== 'string') {
      throw new TypeError('Invalid mangaId for toggling favourite')
    }

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
    if (!isUpsertMangaCommand(command)) {
      throw new TypeError('Invalid parameters for upserting manga')
    }

    return mangaRepo.upsertManga(command)
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
}
