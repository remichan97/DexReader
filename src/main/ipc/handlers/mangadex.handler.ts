import { ImageQuality } from '../../api/enums'
import { MangaDexClient } from '../../api/mangadex-client'
import { FeedParams } from '../../api/search-params/feed.searchparam'
import { MangaSearchParams } from '../../api/search-params/manga.searchparam'
import { wrapIpcHandler } from '../wrap-handler'

const mangadexClient = new MangaDexClient()

export function registerMangaDexHandlers(): void {
  /**
   * Search manga on MangaDex.
   *
   * Queries MangaDex API with filters and pagination. Returns paginated manga results
   * matching search criteria. Supports text search, tag filters, content rating, status,
   * demographic, and sorting options. Rate-limited by main process (5 requests/second).
   *
   * @param query - Search parameters object
   * @param query.title - Text search query (partial match)
   * @param query.includedTags - Array of tag UUIDs (AND logic)
   * @param query.excludedTags - Array of tag UUIDs to exclude
   * @param query.contentRating - Array of ratings: 'safe' | 'suggestive' | 'erotica' | 'pornographic'
   * @param query.status - Array of publication status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
   * @param query.publicationDemographic - 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'
   * @param query.order - Sort field and order (e.g., {latestUploadedChapter: 'desc'})
   * @param query.limit - Results per page (max 100)
   * @param query.offset - Pagination offset
   * @returns Promise<{data: Array<Manga>, total: number}> - Search results with total count
   *
   * @example
   * // Search for action manga
   * const results = await window.api.searchManga({
   *   includedTags: ['391b0423-d847-456f-aff0-8b0cfc03066b'], // Action tag
   *   contentRating: ['safe', 'suggestive'],
   *   status: ['ongoing'],
   *   order: {latestUploadedChapter: 'desc'},
   *   limit: 20,
   *   offset: 0
   * })
   * console.log(`Found ${results.total} manga`)
   */
  wrapIpcHandler('mangadex:search-manga', async (_, query: unknown) => {
    return await mangadexClient.searchManga(query as MangaSearchParams)
  })

  /**
   * Get manga details by ID.
   *
   * Fetches full manga metadata from MangaDex API. Returns manga object with title,
   * description, tags, authors, artists, status, and cover art reference. Use includes
   * parameter to embed related resources (author, artist, cover_art).
   *
   * @param id - MangaDex manga UUID
   * @param includes - Optional array of relationships to embed: 'author' | 'artist' | 'cover_art'
   * @returns Promise<{data: Manga}> - Manga details object
   *
   * @example
   * // Get manga with embedded cover art
   * const result = await window.api.getMangaDetails('xyz789...', ['cover_art', 'author'])
   * console.log(result.data.attributes.title.en)
   */
  wrapIpcHandler('mangadex:get-manga', async (_, id: unknown, includes: unknown) => {
    return await mangadexClient.getManga(id as string, includes as string[] | undefined)
  })

  /**
   * Get manga chapter feed (chapter list).
   *
   * Fetches paginated chapter list for a manga with filters. Returns chapters sorted
   * by volume/chapter number. Supports language filtering, translated language, content
   * rating, and date range filters.
   *
   * @param id - MangaDex manga UUID
   * @param query - Feed parameters
   * @param query.translatedLanguage - Array of language codes to include (e.g., ['en', 'ja'])
   * @param query.contentRating - Array of content ratings (filters out other ratings)
   * @param query.order - Sort order (e.g., {chapter: 'asc'})
   * @param query.limit - Chapters per page (max 500)
   * @param query.offset - Pagination offset
   * @returns Promise<{data: Array<Chapter>, total: number}> - Chapter feed with total count
   *
   * @example
   * // Get English chapters
   * const feed = await window.api.getMangaFeed('xyz789...', {
   *   translatedLanguage: ['en'],
   *   order: {chapter: 'asc'},
   *   limit: 100,
   *   offset: 0
   * })
   * console.log(`${feed.total} English chapters available`)
   */
  wrapIpcHandler('mangadex:get-manga-feed', async (_, id: unknown, query: unknown) => {
    return await mangadexClient.getMangaFeed(id as string, query as FeedParams)
  })

  /**
   * Get chapter details by ID.
   *
   * Fetches metadata for a specific chapter. Returns chapter object with title,
   * volume/chapter numbers, pages count, language, scanlation group, and publish date.
   *
   * @param id - MangaDex chapter UUID
   * @param includes - Optional array of relationships to embed: 'scanlation_group' | 'manga' | 'user'
   * @returns Promise<{data: Chapter}> - Chapter details object
   *
   * @example
   * // Get chapter with scanlation group
   * const result = await window.api.getChapterDetails('abc123...', ['scanlation_group'])
   * console.log(`Chapter ${result.data.attributes.chapter} - ${result.data.attributes.pages} pages`)
   */
  wrapIpcHandler('mangadex:get-chapter', async (_, id: unknown, includes: unknown) => {
    return await mangadexClient.getChapter(id as string, includes as string[] | undefined)
  })

  /**
   * Get chapter image URLs.
   *
   * Fetches image server URL and page filenames for a chapter. Returns base URL and
   * array of image hashes to construct full image URLs. Quality parameter selects
   * between original ('data') and compressed ('data-saver') images.
   *
   * @param id - MangaDex chapter UUID
   * @param quality - Image quality: 'data' (original ~3-5MB/image) or 'data-saver' (compressed ~500KB/image)
   * @returns Promise<{baseUrl: string, chapter: {hash: string, data: string[], dataSaver: string[]}}> - Image URLs
   *
   * @example
   * // Get chapter images at original quality
   * const images = await window.api.getChapterImages('abc123...', 'data')
   * images.chapter.data.forEach((hash, i) => {
   *   const url = `${images.baseUrl}/data/${images.chapter.hash}/${hash}`
   *   console.log(`Page ${i + 1}: ${url}`)
   * })
   */
  wrapIpcHandler('mangadex:get-chapter-images', async (_, id: unknown, quality: unknown) => {
    return await mangadexClient.getChapterImages(id as string, quality as ImageQuality)
  })

  /**
   * Check MangaDex API health status.
   *
   * Pings MangaDex API to verify service is reachable. Returns true if API responds,
   * false if offline or unreachable. Used for connectivity checks before operations.
   *
   * @returns Promise<boolean> - True if MangaDex API is alive, false otherwise
   *
   * @example
   * // Check API before search
   * const isOnline = await window.api.checkMangaDexHealth()
   * if (!isOnline) {
   *   showError('MangaDex API is offline')
   * }
   */
  wrapIpcHandler('mangadex:healthcheck', async () => {
    return await mangadexClient.isServiceAlive()
  })
}
