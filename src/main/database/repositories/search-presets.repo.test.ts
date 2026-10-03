import { CreateSearchPresetCommand } from '@shared/commands/services/create-search-preset.command'
import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'
import { ContentRating } from '@shared/enums/mangadex/content-rating.enum'
import { PublicationDemographic } from '@shared/enums/mangadex/demographic.enum'
import { IncludedTagsMode } from '@shared/enums/mangadex/included-tags-mode.enum'
import { OrderOptions } from '@shared/enums/mangadex/order-options.enum'
import { OrderDirection } from '@shared/enums/mangadex/order-direction.enum'
import { createTestDb, TestDb } from '../../../../vitest/create-test-db'

let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { searchPresetsRepo } from './search-presets.repo'

function filters(overrides: Partial<SearchFiltersData> = {}): SearchFiltersData {
  return {
    contentRating: [ContentRating.Safe],
    publicationDemographic: PublicationDemographic.None,
    includedTagsMode: IncludedTagsMode.AND,
    availableTranslatedLanguages: ['en'],
    resultPerPage: 20,
    sortBy: OrderOptions.Relevance,
    sortDirection: OrderDirection.Desc,
    ...overrides
  }
}

function presetCommand(
  overrides: Partial<CreateSearchPresetCommand> = {}
): CreateSearchPresetCommand {
  return {
    name: 'My Preset',
    filters: filters(),
    ...overrides
  }
}

describe('SearchPresetsRepository', () => {
  beforeEach(() => {
    testDb = createTestDb()
  })

  describe('create', () => {
    it('creates a new preset with the given fields and defaults', () => {
      const result = searchPresetsRepo.create(presetCommand({ searchQuery: 'one piece' }))

      expect(result).toEqual(
        expect.objectContaining({ name: 'My Preset', searchQuery: 'one piece', resultsPerPage: 20 })
      )
    })

    it('defaults searchQuery to empty string and resultsPerPage to 20 when omitted', () => {
      const result = searchPresetsRepo.create(presetCommand())

      expect(result.searchQuery).toBe('')
      expect(result.resultsPerPage).toBe(20)
    })

    it('updates the existing preset in place when the name already exists', () => {
      const created = searchPresetsRepo.create(presetCommand({ searchQuery: 'original' }))

      const updated = searchPresetsRepo.create(
        presetCommand({ searchQuery: 'updated', filters: filters({ resultPerPage: 40 }) })
      )

      expect(updated.id).toBe(created.id)
      expect(updated.searchQuery).toBe('updated')
      expect(searchPresetsRepo.getAll()).toHaveLength(1)
    })

    it('resets searchQuery to empty string on update when omitted, rather than preserving it', () => {
      searchPresetsRepo.create(presetCommand({ searchQuery: 'original' }))

      const updated = searchPresetsRepo.create(presetCommand({ searchQuery: undefined }))

      expect(updated.searchQuery).toBe('')
    })

    it('preserves resultsPerPage on update when omitted', () => {
      searchPresetsRepo.create(presetCommand({ resultsPerPage: 50 }))

      const updated = searchPresetsRepo.create(presetCommand({ resultsPerPage: undefined }))

      expect(updated.resultsPerPage).toBe(50)
    })

    it('rejects a name longer than 50 characters', () => {
      expect(() => searchPresetsRepo.create(presetCommand({ name: 'x'.repeat(51) }))).toThrow()
    })
  })

  describe('getAll / getPresetById / getByName', () => {
    it('returns undefined for a preset that does not exist', () => {
      expect(searchPresetsRepo.getPresetById(999)).toBeUndefined()
      expect(searchPresetsRepo.getByName('missing')).toBeUndefined()
    })

    it('finds a preset by id and by name', () => {
      const created = searchPresetsRepo.create(presetCommand({ name: 'Shounen picks' }))

      expect(searchPresetsRepo.getPresetById(created.id)?.name).toBe('Shounen picks')
      expect(searchPresetsRepo.getByName('Shounen picks')?.id).toBe(created.id)
    })

    it('returns every preset', () => {
      searchPresetsRepo.create(presetCommand({ name: 'A' }))
      searchPresetsRepo.create(presetCommand({ name: 'B' }))

      expect(
        searchPresetsRepo
          .getAll()
          .map((p) => p.name)
          .sort()
      ).toEqual(['A', 'B'])
    })
  })

  describe('updateLastUsedAt', () => {
    it('returns false without throwing for a preset that does not exist', () => {
      expect(searchPresetsRepo.updateLastUsedAt(999)).toBe(false)
    })

    it('returns true and bumps lastUsedAt for an existing preset', () => {
      const created = searchPresetsRepo.create(presetCommand())

      expect(searchPresetsRepo.updateLastUsedAt(created.id)).toBe(true)
    })
  })

  describe('delete', () => {
    it('returns false without throwing for a preset that does not exist', () => {
      expect(searchPresetsRepo.delete(999)).toBe(false)
    })

    it('deletes an existing preset and returns true', () => {
      const created = searchPresetsRepo.create(presetCommand())

      expect(searchPresetsRepo.delete(created.id)).toBe(true)
      expect(searchPresetsRepo.getPresetById(created.id)).toBeUndefined()
    })
  })
})
