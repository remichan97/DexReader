import { SearchFiltersData } from '../../types/search-preset.type'

export interface CreateSearchPresetCommand {
  name: string
  filters: SearchFiltersData
  searchQuery?: string
  resultsPerPage?: number
}
