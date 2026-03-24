import { RateLimiter } from './rate-limiter'
import { ApiConfig } from './constants/api-config.constant'
import { MangaDexApiError, MangaDexNetworkError } from './shared/error.shared'
import { MangaSearchParams } from './search-params/manga.searchparam'
import { CollectionResponse } from './responses/collection.response'
import { Manga } from './entities/manga.entity'
import { URLSearchParams } from 'node:url'
import { ApiResponse } from './responses/api.response'
import { FeedParams } from './search-params/feed.searchparam'
import { Chapter } from './entities/chapter.entity'
import { ImageQuality } from './enums'
import { ImageUrlResponse } from './responses/image-url.response'
import { ChapterImagesResponse } from './responses/chapter-image.response'

export class MangaDexClient {
  baseUrl: string
  userAgent: string
  timeout: number
  rateLimiter: RateLimiter
  constructor(baseUrl?: string, userAgent?: string, timeout?: number) {
    this.baseUrl = baseUrl || ApiConfig.BASE_API_URL
    this.userAgent = userAgent || ApiConfig.REQUEST_USER_AGENT
    this.timeout = timeout || ApiConfig.API_TIMEOUT_MS
    this.rateLimiter = new RateLimiter()
  }

  //#region Manga endpoints

  // Search manga with various parameters
  async searchManga(params: MangaSearchParams): Promise<CollectionResponse<Manga>> {
    await this.rateLimiter.waitForToken()

    const queryParams = this.buildQueryParams(params)

    return this.fetch<CollectionResponse<Manga>>(`/manga?${queryParams.toString()}`)
  }

  // Get manga by ID, with optional includes
  async getManga(mangaId: string, includes?: string[]): Promise<ApiResponse<Manga>> {
    await this.rateLimiter.waitForToken()

    const includeParams = includes ? includes.map((inc) => `includes[]=${inc}`).join('&') : ''

    return this.fetch<ApiResponse<Manga>>(
      `/manga/${mangaId}${includeParams ? `?${includeParams}` : ''}`
    )
  }

  // Get Chapter list of a Manga
  async getMangaFeed(mangaId: string, params: FeedParams): Promise<CollectionResponse<Chapter>> {
    await this.rateLimiter.waitForToken()

    const queryParams = this.buildQueryParams(params)

    return this.fetch<CollectionResponse<Chapter>>(
      `/manga/${mangaId}/feed?${queryParams.toString()}`
    )
  }

  // Call the ping endpoint to see if we have a connection to it
  // Returns true if we get a `pong` back from the API, else false
  async isServiceAlive(): Promise<boolean> {
    try {
      await this.rateLimiter.waitForToken()

      const url = `${this.baseUrl}/ping`
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) return false

      const text = await response.text()
      return text === 'pong'
    } catch (error) {
      console.error('[MangaDex] Ping failed:', error)
      return false
    }
  }

  //#endregion

  //#region Chapter endpoints

  // Get chapter by ID, with optional includes
  async getChapter(chapterId: string, includes?: string[]): Promise<ApiResponse<Chapter>> {
    await this.rateLimiter.waitForToken()

    const includeParams = includes ? includes.map((inc) => `includes[]=${inc}`).join('&') : ''

    return this.fetch<ApiResponse<Chapter>>(
      `/chapter/${chapterId}${includeParams ? `?${includeParams}` : ''}`
    )
  }

  //#endregion

  //#region Images (chapters, covers) endpoints

  // Get chapter images by chapter ID
  async getChapterImages(chapterId: string, quality: ImageQuality): Promise<ImageUrlResponse[]> {
    await this.rateLimiter.waitForToken('at-home/server') // This thing has its own limit of 40reqs/min

    const response = await this.fetch<ChapterImagesResponse>(`/at-home/server/${chapterId}`)

    const baseUrl = response.baseUrl
    const chapterData = response.chapter[quality]
    const hash = response.chapter.hash

    return chapterData.map((filename) => ({
      url: `${baseUrl}/data/${hash}/${filename}`,
      filename,
      quality
    }))
  }

  //#endregion

  //#region Private helper methods
  /**
   * Internal fetch with automatic retry for rate limit errors (429)
   * Frontend-facing calls get transparent retry, while download queue handles its own retry logic
   */
  private async fetch<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const maxRetries = 3
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.timeout)
      })

      const requestId = response.headers.get('X-Request-ID') || 'N/A'

      if (!response.ok) {
        const errorBody = await response.text()
        let parsedError: unknown
        try {
          parsedError = JSON.parse(errorBody)
        } catch {
          // If parsing fails, leave it undefined
        }

        // Handle rate limit errors (429) with retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('X-RateLimit-Retry-After')
          const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter) : undefined

          // Reset rate limiter state (tokens to zero, set refill time)
          this.rateLimiter.handleRateLimitResponse(retryAfterSeconds)

          // Retry if we haven't exceeded max attempts
          if (retryCount < maxRetries) {
            // Calculate retry delay with jitter
            const baseDelay = retryAfterSeconds
              ? retryAfterSeconds * 1000
              : 1000 * Math.pow(2, retryCount)
            const jitterFactor = 0.8 + Math.random() * 0.4 // ±20% jitter
            const delay = Math.floor(baseDelay * jitterFactor)

            console.warn(
              `[MangaDex] Request ID: ${requestId} - Rate limited (429). ` +
                `Retrying in ${Math.floor(delay / 1000)}s (attempt ${retryCount + 1}/${maxRetries})...`
            )

            await new Promise((resolve) => setTimeout(resolve, delay))
            return this.fetch<T>(endpoint, options, retryCount + 1) // Recursive retry
          }

          // Max retries exceeded, throw with retry info
          console.error(
            `[MangaDex] Request ID: ${requestId} - Rate limit retry exhausted after ${maxRetries} attempts`
          )

          throw new MangaDexApiError(
            `HTTP ${response.status}: ${response.statusText} (retried ${maxRetries} times)`,
            parsedError,
            requestId,
            response.status,
            retryAfterSeconds
          )
        }

        // For other errors (404, 403, 5xx), throw immediately with status code
        throw new MangaDexApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          parsedError,
          requestId,
          response.status
        )
      }

      // Success - return the JSON response
      return response.json()
    } catch (error: unknown) {
      if (error instanceof MangaDexApiError) throw error

      throw new MangaDexNetworkError((error as Error).message, url)
    }
  }

  private buildQueryParams(params: object): URLSearchParams {
    const queryParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        // MangaDex API requires [] suffix for array parameters
        value.forEach((v) => queryParams.append(`${key}[]`, v.toString()))
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue !== undefined && subValue !== null) {
            queryParams.append(`${key}[${subKey}]`, subValue.toString())
          }
        }
      } else {
        queryParams.append(key, value.toString())
      }
    }

    return queryParams
  }
  //#endregion
}
