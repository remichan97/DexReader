import { isValidCreateSearchPresetOptions } from './search-presets.validator'
import {
  ContentRating,
  IncludedTagsMode,
  OrderDirection,
  OrderOptions,
  PublicationDemographic,
  PublicationStatus
} from '../../api/enums'
import { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'
import { CreateSearchPresetCommand } from '@shared/commands/services/create-search-preset.command'

function validFilters(overrides: Partial<SearchFiltersData> = {}): SearchFiltersData {
  return {
    contentRating: [ContentRating.Safe],
    publicationDemographic: PublicationDemographic.Shounen,
    includedTagsMode: IncludedTagsMode.AND,
    availableTranslatedLanguages: ['en'],
    resultPerPage: 20,
    sortBy: OrderOptions.Relevance,
    sortDirection: OrderDirection.Desc,
    ...overrides
  }
}

function validCommand(
  overrides: Partial<CreateSearchPresetCommand> = {}
): CreateSearchPresetCommand {
  return {
    name: 'Completed Action',
    filters: validFilters(),
    ...overrides
  }
}

describe('isValidCreateSearchPresetOptions', () => {
  it('accepts a minimal valid command with no optional fields', () => {
    expect(isValidCreateSearchPresetOptions({ name: 'My Preset' })).toBe(true)
  })

  it('accepts a fully-populated valid command', () => {
    expect(
      isValidCreateSearchPresetOptions(
        validCommand({ searchQuery: 'berserk', resultsPerPage: 50, setAsDefault: true })
      )
    ).toBe(true)
  })

  it.each([null, 'a string', 42, true])('rejects a non-object value: %s', (value) => {
    expect(() => isValidCreateSearchPresetOptions(value)).toThrow(TypeError)
  })

  it('rejects a missing or non-string name', () => {
    expect(() => isValidCreateSearchPresetOptions({})).toThrow(/preset name/i)
    expect(() => isValidCreateSearchPresetOptions({ name: 42 })).toThrow(/preset name/i)
  })

  it('rejects a non-string searchQuery', () => {
    expect(() => isValidCreateSearchPresetOptions({ name: 'x', searchQuery: 42 })).toThrow(
      /preset search query/i
    )
  })

  it('rejects a non-object filters value', () => {
    expect(() => isValidCreateSearchPresetOptions({ name: 'x', filters: 'nope' })).toThrow(
      /preset filters/i
    )
  })

  it('rejects a non-boolean setAsDefault', () => {
    expect(() => isValidCreateSearchPresetOptions({ name: 'x', setAsDefault: 'yes' })).toThrow(
      /setAsDefault/
    )
  })

  describe('filters validation', () => {
    it('rejects contentRating that is not an array of valid ContentRating values', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ contentRating: ['not-a-rating'] as never }) })
        )
      ).toThrow(/contentRating/)
    })

    it('rejects an invalid publicationStatus when provided', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ publicationStatus: 'bogus' as never }) })
        )
      ).toThrow(/publicationStatus/)
    })

    it('accepts an undefined publicationStatus', () => {
      expect(
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ publicationStatus: undefined }) })
        )
      ).toBe(true)
    })

    it('accepts a valid publicationStatus', () => {
      expect(
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ publicationStatus: PublicationStatus.Ongoing }) })
        )
      ).toBe(true)
    })

    it('rejects an invalid publicationDemographic', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ publicationDemographic: 'bogus' as never }) })
        )
      ).toThrow(/publicationDemographic/)
    })

    it.each(['includedTags', 'excludedTags'] as const)(
      'rejects a non-string-array %s when provided',
      (field) => {
        expect(() =>
          isValidCreateSearchPresetOptions(
            validCommand({ filters: validFilters({ [field]: [1, 2] as never }) })
          )
        ).toThrow(new RegExp(field))
      }
    )

    it.each(['includedTags', 'excludedTags'] as const)('accepts an undefined %s', (field) => {
      expect(
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ [field]: undefined }) })
        )
      ).toBe(true)
    })

    it('rejects an invalid includedTagsMode', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ includedTagsMode: 'bogus' as never }) })
        )
      ).toThrow(/includedTagsMode/)
    })

    it('rejects a non-string-array availableTranslatedLanguages', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({
            filters: validFilters({ availableTranslatedLanguages: 'en' as never })
          })
        )
      ).toThrow(/availableTranslatedLanguages/)
    })

    it('rejects a non-numeric resultPerPage', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ resultPerPage: '20' as never }) })
        )
      ).toThrow(TypeError)
    })

    it.each([15, 101, 23])(
      'rejects a resultPerPage out of range or not a multiple of 5: %i',
      (n) => {
        expect(() =>
          isValidCreateSearchPresetOptions(
            validCommand({ filters: validFilters({ resultPerPage: n }) })
          )
        ).toThrow(RangeError)
      }
    )

    it.each([20, 50, 100])('accepts a valid resultPerPage: %i', (n) => {
      expect(
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ resultPerPage: n }) })
        )
      ).toBe(true)
    })

    it('rejects an invalid sortBy', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ sortBy: 'bogus' as never }) })
        )
      ).toThrow(/sortBy/)
    })

    it('rejects an invalid sortDirection', () => {
      expect(() =>
        isValidCreateSearchPresetOptions(
          validCommand({ filters: validFilters({ sortDirection: 'bogus' as never }) })
        )
      ).toThrow(/sortDirection/)
    })
  })
})
