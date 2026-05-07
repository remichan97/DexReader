import { SearchFiltersData } from '../../types/search-preset.type'

export interface SearchPresetQuery {
  id: number
  name: string
  description?: string
  searchQuery?: string
  filters: SearchFiltersData
}
