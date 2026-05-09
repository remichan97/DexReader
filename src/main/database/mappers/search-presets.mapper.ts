import { SearchPresetQuery } from '../queries/search-presets/search-preset.query'
import { SearchFiltersData } from '../types/search-preset.type'

type SearchPresetRow = {
  id: number
  name: string
  searchQuery: string | null
  filters: SearchFiltersData
  resultsPerPage: number
  createdAt: Date
  updatedAt: Date
  lastUsedAt: Date
}

export class SearchPresetsMapper {
  static toQuery(row: SearchPresetRow): SearchPresetQuery {
    return {
      id: row.id,
      name: row.name,
      searchQuery: row.searchQuery ?? undefined,
      filters: row.filters,
      resultsPerPage: row.resultsPerPage
    }
  }
}
