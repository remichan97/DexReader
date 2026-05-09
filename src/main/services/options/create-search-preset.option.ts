import { SearchFiltersData } from '../../database/types/search-preset.type'

export interface CreateSearchPresetOptions {
  name: string
  filters: SearchFiltersData
  searchQuery?: string
  resultsPerPage?: number
  setAsDefault?: boolean
}
