import { SearchPresetsMapper } from './search-presets.mapper'
import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'
import {
  ContentRating,
  IncludedTagsMode,
  OrderDirection,
  OrderOptions,
  PublicationDemographic
} from '@shared/enums/mangadex'

type SearchPresetRow = Parameters<typeof SearchPresetsMapper.toQuery>[0]

function searchFilters(): SearchFiltersData {
  return {
    contentRating: [ContentRating.Safe],
    publicationDemographic: PublicationDemographic.Shounen,
    includedTagsMode: IncludedTagsMode.AND,
    availableTranslatedLanguages: ['en'],
    resultPerPage: 20,
    sortBy: OrderOptions.Relevance,
    sortDirection: OrderDirection.Desc
  }
}

function row(overrides: Partial<SearchPresetRow> = {}): SearchPresetRow {
  return {
    id: 1,
    name: 'Completed Action',
    searchQuery: 'berserk',
    filters: searchFilters(),
    resultsPerPage: 20,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    lastUsedAt: new Date('2026-01-03T00:00:00.000Z'),
    ...overrides
  }
}

describe('toQuery', () => {
  it('maps a search preset row to the query contract', () => {
    const result = SearchPresetsMapper.toQuery(row())

    expect(result).toEqual({
      id: 1,
      name: 'Completed Action',
      searchQuery: 'berserk',
      filters: searchFilters(),
      resultsPerPage: 20
    })
  })

  it('falls back to undefined when searchQuery is null', () => {
    const result = SearchPresetsMapper.toQuery(row({ searchQuery: null }))

    expect(result.searchQuery).toBeUndefined()
  })

  it('does not forward createdAt, updatedAt, or lastUsedAt to the contract', () => {
    const result = SearchPresetsMapper.toQuery(row())

    expect(result).not.toHaveProperty('createdAt')
    expect(result).not.toHaveProperty('updatedAt')
    expect(result).not.toHaveProperty('lastUsedAt')
  })
})
