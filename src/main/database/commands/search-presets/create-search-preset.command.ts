import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'

export interface CreateSearchPresetCommand {
  name: string
  filters: SearchFiltersData
  searchQuery?: string
  resultsPerPage?: number
}
