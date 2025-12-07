import { ContentRating } from '../enums/content-rating.enum'
import { OrderDirection } from '../enums/order-direction.enum'
import { ChapterOrderOptions } from '../enums/chapter-order-options.enum'
import { ChapterIncludes } from '../enums/chapter-includes.enum'
import { IncludeFutureUpdates } from '../enums/future-updates.enum'

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
  order?: Record<ChapterOrderOptions, OrderDirection>
  includes?: ChapterIncludes[]
}
