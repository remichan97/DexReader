import {
  ContentRating,
  PublicationDemographic,
  PublicationStatus,
  OrderOptions,
  OrderDirection,
  IncludedTagsMode,
  MangaIncludes
} from '@shared/enums/mangadex'

export interface MangaSearchParams {
  title?: string
  authors?: string[] // Search for work matches by someone who is credited as an author.
  artists?: string[] // Search for work matches by someone who is credited as an artist.
  authorOrArtist?: string // Search for work matches by someone who is credited as either an author or artist.
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
  availableTranslatedLanguage?: string[]
  originalLanguage?: string[]
  excludedOriginalLanguage?: string[]
  order?: Record<OrderOptions, OrderDirection>
  includes?: MangaIncludes[]
  hasAvailableChapters?: boolean | 'true' | 'false'
  limit?: number
  offset?: number
}
