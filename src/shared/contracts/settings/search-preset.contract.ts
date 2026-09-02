import { SearchFiltersData } from './search-filters.contract'

export interface SearchPresetQuery {
  id: number
  name: string
  searchQuery?: string
  filters: SearchFiltersData
  resultsPerPage: number
}
