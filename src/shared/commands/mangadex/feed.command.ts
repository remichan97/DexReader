import {
  ContentRating,
  OrderDirection,
  ChapterOrderOptions,
  ChapterIncludes,
  IncludeFutureUpdates
} from '../../enums/mangadex'

export interface FeedParams {
  limit?: number
  offset?: number
  translatedLanguage?: string[]
  originalLanguage?: string[]
  excludedOriginalLanguage?: string[]
  contentRating?: ContentRating[]
  includeFutureUpdates?: IncludeFutureUpdates
  createdAtSince?: string
  updatedAtSince?: string
  publishedAtSince?: string
  order?: Partial<Record<ChapterOrderOptions, OrderDirection>>
  includes?: ChapterIncludes[]
}
