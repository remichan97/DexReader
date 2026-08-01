import {
  ContentRating,
  IncludedTagsMode,
  OrderDirection,
  OrderOptions,
  PublicationDemographic,
  PublicationStatus
} from '../../api/enums'
import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'
import { CreateSearchPresetOptions } from '../../services/options/create-search-preset.option'

export function isValidCreateSearchPresetOptions(
  options: unknown
): options is CreateSearchPresetOptions {
  if (typeof options !== 'object' || options === undefined || options === null) {
    throw new TypeError('Expected an object for the create search preset command')
  }

  const createCommand = options as CreateSearchPresetOptions

  if (typeof createCommand.name !== 'string') {
    throw new TypeError('Expected a string for the preset name')
  }

  if (createCommand.searchQuery !== undefined && typeof createCommand.searchQuery !== 'string') {
    throw new TypeError('Expected a string or undefined for the preset search query')
  }

  if (createCommand.filters !== undefined && typeof createCommand.filters !== 'object') {
    throw new TypeError('Expected an object or undefined for the preset filters')
  }

  if (createCommand.filters !== undefined && !isValidSearchPresetData(createCommand.filters)) {
    throw new TypeError('Invalid search preset filters data')
  }

  if (createCommand.setAsDefault !== undefined && typeof createCommand.setAsDefault !== 'boolean') {
    throw new TypeError('Expected a boolean or undefined for setAsDefault')
  }

  return true
}

function isValidSearchPresetData(filters: unknown): filters is SearchFiltersData {
  if (typeof filters !== 'object' || filters === null) {
    throw new TypeError('Expected an object for the search preset filters')
  }

  const data = filters as SearchFiltersData

  if (
    !Array.isArray(data.contentRating) ||
    !data.contentRating.every((r) => Object.values(ContentRating).includes(r))
  ) {
    throw new TypeError('Expected an array of valid ContentRating for contentRating')
  }

  if (
    data.publicationStatus !== undefined &&
    !Object.values(PublicationStatus).includes(data.publicationStatus)
  ) {
    throw new TypeError('Expected a valid PublicationStatus or undefined for publicationStatus')
  }

  if (
    data.publicationDemographic !== undefined &&
    !Object.values(PublicationDemographic).includes(data.publicationDemographic)
  ) {
    throw new TypeError(
      'Expected a valid PublicationDemographic or undefined for publicationDemographic'
    )
  }

  if (
    data.includedTags !== undefined &&
    (!Array.isArray(data.includedTags) || !data.includedTags.every((t) => typeof t === 'string'))
  ) {
    throw new TypeError('Expected an array of strings or undefined for includedTags')
  }

  if (
    data.excludedTags !== undefined &&
    (!Array.isArray(data.excludedTags) || !data.excludedTags.every((t) => typeof t === 'string'))
  ) {
    throw new TypeError('Expected an array of strings or undefined for excludedTags')
  }

  if (!Object.values(IncludedTagsMode).includes(data.includedTagsMode)) {
    throw new TypeError('Expected a valid IncludedTagsMode for includedTagsMode')
  }

  if (
    !Array.isArray(data.availableTranslatedLanguages) ||
    !data.availableTranslatedLanguages.every((l) => typeof l === 'string')
  ) {
    throw new TypeError('Expected an array of strings for availableTranslatedLanguages')
  }

  //ResultPerPage must be at least 20 and at most 100, with the increments of 5
  if (typeof data.resultPerPage !== 'number') {
    throw new TypeError('Expected a number for resultPerPage')
  }

  if (data.resultPerPage < 20 || data.resultPerPage > 100 || data.resultPerPage % 5 !== 0) {
    throw new RangeError('resultPerPage must be between 20 and 100, with increments of 5')
  }

  if (!Object.values(OrderOptions).includes(data.sortBy)) {
    throw new TypeError('Expected a valid OrderOptions for sortBy')
  }

  if (!Object.values(OrderDirection).includes(data.sortDirection)) {
    throw new TypeError('Expected a valid OrderDirection for sortDirection')
  }

  return true
}
