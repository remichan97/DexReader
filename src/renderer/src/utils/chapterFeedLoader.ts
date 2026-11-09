import {
  ChapterIncludes,
  ChapterOrderOptions,
  ContentRating,
  OrderDirection
} from '@shared/enums/mangadex'
import type { ChapterContract } from '../../../preload/window.types'
import { toError } from '@shared/utils/to-error.util'
import { sortChaptersAscending } from './chapterOrder'

/** The most chapters MangaDex returns for one feed request */
const FEED_PAGE_SIZE = 500

// A library entry can be of any rating, and the feed leaves out pornographic titles unless asked
const ALL_CONTENT_RATINGS = [
  ContentRating.Safe,
  ContentRating.Suggestive,
  ContentRating.Erotica,
  ContentRating.Pornographic
]

export type ChapterDirection = 'asc' | 'desc'

export interface FeedPage {
  chapters: ChapterContract[]
  total: number
  /** Where this page started in the feed */
  offset: number
}

export interface ChapterFeedProgress {
  /** Everything received so far: oldest first, with a repeated chapter kept once */
  chapters: ChapterContract[]
  total: number
  /** True once the last page has arrived. A series that fits one page is complete at once */
  complete: boolean
  /** Which end of the series the first page came from, so the missing chapters are at the other */
  loadedFrom: 'oldest' | 'newest'
}

export interface ChapterFeedResult {
  status: 'complete' | 'partial' | 'cancelled'
  /** Why a later page failed, when status is 'partial' */
  error?: Error
}

interface FeedRequest {
  mangaId: string
  /** Only chapters in this language; omit for every language */
  language?: string
  /** Which end of the series the pages start from */
  direction: ChapterDirection
}

/**
 * One page of a manga's chapter feed, in the given direction. Throws when the request fails.
 *
 * The feed is ordered by chapter number, then by publish date the same way: several groups often
 * upload the same chapter, and without the second key their order (and so which page they land
 * on) is left to the API.
 */
export async function fetchChapterFeedPage(
  request: FeedRequest & { offset: number }
): Promise<FeedPage> {
  const direction = request.direction === 'asc' ? OrderDirection.Asc : OrderDirection.Desc

  const response = await globalThis.mangadex.getMangaFeed(request.mangaId, {
    limit: FEED_PAGE_SIZE,
    offset: request.offset,
    translatedLanguage: request.language ? [request.language] : undefined,
    contentRating: ALL_CONTENT_RATINGS,
    order: {
      [ChapterOrderOptions.CHAPTER]: direction,
      [ChapterOrderOptions.PUBLISHED_AT]: direction
    },
    includes: [ChapterIncludes.SCANLATION_GROUP]
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch chapters')
  }
  if (response.data.result === 'error') {
    throw new Error('Failed to fetch chapters from API')
  }

  return {
    chapters: response.data.data,
    total: response.data.total,
    offset: request.offset
  }
}

interface LoadChapterFeedParams extends FeedRequest {
  /** Called with the whole list so far after every page, the first one included */
  onPage: (progress: ChapterFeedProgress) => void
  /** The first page, when the caller already fetched it (to see whether a language has chapters) */
  firstPage?: FeedPage
  signal?: AbortSignal
}

/**
 * Load a manga's whole chapter feed page by page, reporting after each.
 *
 * The first page arrives in the requested direction, so a list shown newest first can be shown
 * after one request, and the rest follows in the background. Every report carries the merged,
 * oldest-first list (see chapterOrder), which is what the rest of the app expects.
 *
 * A failure on the first page throws. A failure on a later page ends the load as 'partial' and
 * leaves what was already reported in place. Cancelling through `signal` stops quietly.
 */
export async function loadChapterFeed(params: LoadChapterFeedParams): Promise<ChapterFeedResult> {
  const { onPage, signal } = params
  const loadedFrom = params.direction === 'asc' ? 'oldest' : 'newest'

  const first = params.firstPage ?? (await fetchChapterFeedPage({ ...params, offset: 0 }))

  if (signal?.aborted) return { status: 'cancelled' }

  const received = [...first.chapters]
  let total = first.total
  let nextOffset = first.offset + first.chapters.length

  const report = (): void => {
    onPage({
      chapters: sortChaptersAscending(received),
      total,
      complete: nextOffset >= total,
      loadedFrom
    })
  }
  report()

  // An empty page ends the loop too, so a feed that reports a larger total than it holds
  // (chapters removed mid-load) can't spin forever
  while (nextOffset < total) {
    if (signal?.aborted) return { status: 'cancelled' }

    let page: FeedPage
    try {
      page = await fetchChapterFeedPage({ ...params, offset: nextOffset })
    } catch (error) {
      return { status: 'partial', error: toError(error) }
    }

    if (signal?.aborted) return { status: 'cancelled' }

    received.push(...page.chapters)
    total = page.total
    nextOffset += page.chapters.length

    if (page.chapters.length === 0) {
      total = nextOffset
    }
    report()
  }

  return { status: 'complete' }
}
