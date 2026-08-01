import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'

export interface CreateSearchPresetOptions {
  name: string
  filters: SearchFiltersData
  searchQuery?: string
  resultsPerPage?: number
  setAsDefault?: boolean
}
