import { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'
import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'

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
