import { SearchFiltersData } from '../../types/search-preset.type'

export interface CreateSearchPresetCommand {
  id: number
  name: string
  filters: SearchFiltersData
  searchQuery?: string
}
