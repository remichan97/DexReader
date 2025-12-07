import { ContentRating } from './../enums/content-rating.enum'
import { PublicationDemographic } from '../enums/demographic.enum'
import { PublicationStatus } from '../enums/publication-status.enum'
import { OrderOptions } from '../enums/order-options.enum'
import { OrderDirection } from '../enums/order-direction.enum'
import { IncludedTagsMode } from '../enums/included-tags-mode.enum'
import { MangaIncludes } from '../enums/manga-includes.enum'

export interface MangaSearchParams {
  title?: string
  authors?: string[]
  artists?: string[]
  years?: number
  includedTags?: string[]
  excludedTags?: string[]
  excludedTagsMode?: IncludedTagsMode
  status?: PublicationStatus[]
  publicationDemographic?: PublicationDemographic[]
  ids?: string[]
  contentRating?: ContentRating[]
  createdAtSince?: string
  updatedAtSince?: string
  order?: Record<OrderOptions, OrderDirection>
  includes?: MangaIncludes[]
  hasAvailableChapters?: boolean | 'true' | 'false'
  limit?: number
  offset?: number
}
