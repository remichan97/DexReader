import { RateLimiter } from './rateLimiter'
import { ApiConfig } from './constants/api-config.constant'
import { MangaDexApiError, MangaDexNetworkError } from './shared/error.shared'
import { MangaSearchParams } from './searchparams/manga.searchparam'
import { CollectionResponse } from './responses/collection.response'
import { Manga } from './entities/manga.entity'
import { URLSearchParams } from 'node:url'
import { ApiResponse } from './responses/api.response'
import { FeedParams } from './searchparams/feed.searchparam'
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
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers = {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Attempt the request, handling rate limits as necessary
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.timeout)
      })

      const requestId = response.headers.get('X-Request-ID') || 'N/A'

      if (!response.ok) {
        // Only retry on rate limit (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('X-RateLimit-Retry-After')
          const delay = this.rateLimiter.handleRateLimitResponse(
            retryAfter ? Number.parseInt(retryAfter) : undefined
          )

          // We got rate limited, log it and retry after the specified delay
          console.warn(
            `[MangaDex] Request ID: ${requestId} - Rate limited. Retrying after ${delay} ms.`
          )

          await new Promise((resolve) => setTimeout(resolve, delay))
          return this.fetch<T>(endpoint, options) // Retry the request
        }

        // For other errors, throw
        const errorBody = await response.text()
        throw new MangaDexApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          JSON.parse(errorBody),
          requestId
        )
      }

      // We made it, return the JSON response
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
