import {
  ContentRating,
  IncludedTagsMode,
  OrderDirection,
  OrderOptions,
  PublicationDemographic,
  PublicationStatus
} from '../../api/enums'

export interface SearchFiltersData {
  contentRating: ContentRating[]
  publicationStatus?: PublicationStatus // Leaving this empty means all publication statuses will be included in the search results
  publicationDemographic: PublicationDemographic
  includedTags?: string[]
  excludedTags?: string[]
  includedTagsMode: IncludedTagsMode
  availableTranslatedLanguages: string[]
  resultPerPage: number
  sortBy: OrderOptions
  sortDirection: OrderDirection
}
