/**
 * Filter Panel Component
 *
 * Filter controls for manga search: content rating, status, demographic,
 * and sort options. Rendered inside a Modal (see BrowseView) - its own
 * Apply/Clear/Save Preset actions live in the Modal's footer rather than
 * in this component, so they stay pinned below the scrollable content
 * instead of scrolling away with it.
 */

import type { JSX } from 'react'
import { useMemo } from 'react'
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel
} from '@fluentui/react-components'
import { Select } from '@renderer/components/Select'
import { Checkbox } from '@renderer/components/Checkbox'
import { PresetSelector } from '@renderer/components/PresetSelector'
import { TagPicker, type TagPickerTagOption } from '@renderer/components/TagPicker'
import { useTranslation } from '@renderer/hooks/useTranslation'
import {
  ContentRating,
  PublicationStatus,
  PublicationDemographic,
  OrderOptions,
  OrderDirection,
  IncludedTagsMode,
  type SearchFilters
} from '@renderer/stores/searchStore'
import { useSearchPresetsStore } from '@renderer/stores'
import { getAllTagsGrouped } from '@renderer/utils/tagHelpers'
import { LanguageList } from '@renderer/constants/language-list.constant'
import './FilterPanel.css'

interface FilterPanelProps {
  readonly filters: SearchFilters
  readonly limit: number
  readonly onChange: (filters: Partial<SearchFilters>) => void
  readonly onLimitChange: (limit: number) => void
  readonly currentPresetId?: number | null
  readonly onPresetSelect?: (presetId: number | null) => void
  readonly onPresetDelete?: (id: number, name: string) => void
}

export function FilterPanel({
  filters,
  limit,
  onChange,
  onLimitChange,
  currentPresetId,
  onPresetSelect,
  onPresetDelete
}: FilterPanelProps): JSX.Element {
  const { t } = useTranslation('browse')
  const { presets } = useSearchPresetsStore()

  const flatTagOptions = useMemo<TagPickerTagOption[]>(
    () =>
      Object.entries(getAllTagsGrouped()).flatMap(([groupName, tags]) =>
        tags.map((tag) => ({ id: tag.id, name: tag.name, group: groupName }))
      ),
    []
  )

  const handleContentRatingChange = (rating: ContentRating, checked: boolean): void => {
    const newRatings = checked
      ? [...filters.contentRating, rating]
      : filters.contentRating.filter((r) => r !== rating)
    onChange({ contentRating: newRatings })
  }

  const handleStatusChange = (value: string): void => {
    const statuses = value === 'all' ? [] : [value as PublicationStatus]
    onChange({ publicationStatus: statuses })
  }

  const handleDemographicChange = (value: string): void => {
    const demographics = value === 'all' ? [] : [value as PublicationDemographic]
    onChange({ publicationDemographic: demographics })
  }

  const handleSortChange = (value: string): void => {
    onChange({ sortBy: value as OrderOptions })
  }

  const handleSortDirectionChange = (value: string): void => {
    onChange({ sortDirection: value as OrderDirection })
  }

  const handleTagModeChange = (value: string): void => {
    onChange({ includedTagsMode: value as IncludedTagsMode })
  }

  const handleLanguageChange = (languageCode: string, checked: boolean): void => {
    const newLanguages = checked
      ? [...filters.availableTranslatedLanguage, languageCode]
      : filters.availableTranslatedLanguage.filter((code) => code !== languageCode)
    onChange({ availableTranslatedLanguage: newLanguages })
  }

  return (
    <div className="filter-panel">
      {/* Quick Filters Row */}
      <div className="filter-panel__quick flex items-start gap-4 flex-wrap">
        {/* Search Preset - Only show if presets exist */}
        {onPresetSelect && onPresetDelete && presets.length > 0 && (
          <div className="filter-panel__group flex flex-col gap-2">
            <span className="filter-panel__label">{t('preset.searchPreset')}</span>
            <PresetSelector
              currentPresetId={currentPresetId ?? null}
              onSelect={onPresetSelect}
              onDelete={onPresetDelete}
            />
          </div>
        )}

        {/* Content Rating */}
        <div className="filter-panel__group flex flex-col gap-2">
          <span className="filter-panel__label">{t('filter.contentRating')}</span>
          <div className="filter-panel__checkboxes flex gap-4 flex-wrap items-center">
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Safe)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Safe, checked)}
              label={t('filter.contentRatings.safe')}
            />
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Suggestive)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Suggestive, checked)}
              label={t('filter.contentRatings.suggestive')}
            />
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Erotica)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Erotica, checked)}
              label={t('filter.contentRatings.erotica')}
            />
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Pornographic)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Pornographic, checked)}
              label={t('filter.contentRatings.pornographic')}
            />
          </div>
        </div>

        {/* Status */}
        <div className="filter-panel__group flex flex-col gap-2">
          <span className="filter-panel__label">{t('filter.status')}</span>
          <Select
            value={filters.publicationStatus[0] || 'all'}
            onChange={handleStatusChange}
            options={[
              { value: 'all', label: t('filter.statuses.all') },
              { value: PublicationStatus.Ongoing, label: t('filter.statuses.ongoing') },
              { value: PublicationStatus.Completed, label: t('filter.statuses.completed') },
              { value: PublicationStatus.Hiatus, label: t('filter.statuses.hiatus') },
              { value: PublicationStatus.Cancelled, label: t('filter.statuses.cancelled') }
            ]}
          />
        </div>

        {/* Demographic */}
        <div className="filter-panel__group flex flex-col gap-2">
          <span className="filter-panel__label">{t('filter.demographic')}</span>
          <Select
            value={filters.publicationDemographic[0] || 'all'}
            onChange={handleDemographicChange}
            options={[
              { value: 'all', label: t('filter.demographics.all') },
              { value: PublicationDemographic.Shounen, label: t('filter.demographics.shounen') },
              { value: PublicationDemographic.Shoujo, label: t('filter.demographics.shoujo') },
              { value: PublicationDemographic.Seinen, label: t('filter.demographics.seinen') },
              { value: PublicationDemographic.Josei, label: t('filter.demographics.josei') },
              { value: PublicationDemographic.None, label: t('filter.demographics.none') }
            ]}
          />
        </div>

        {/* Sort By */}
        <div className="filter-panel__group flex flex-col gap-2">
          <span className="filter-panel__label">{t('filter.sortBy')}</span>
          <Select
            value={filters.sortBy}
            onChange={handleSortChange}
            options={[
              { value: OrderOptions.Relevance, label: t('filter.sortOptions.relevance') },
              { value: OrderOptions.UpdatedAt, label: t('filter.sortOptions.latestUpdate') },
              { value: OrderOptions.CreatedAt, label: t('filter.sortOptions.recentlyAdded') },
              { value: OrderOptions.FollowedCount, label: t('filter.sortOptions.mostFollows') },
              { value: OrderOptions.Rating, label: t('filter.sortOptions.highestRated') },
              { value: OrderOptions.Title, label: t('filter.sortOptions.title') },
              { value: OrderOptions.Year, label: t('filter.sortOptions.year') }
            ]}
          />
        </div>

        {/* Sort Direction */}
        <div className="filter-panel__group flex flex-col gap-2">
          <span className="filter-panel__label">{t('filter.order')}</span>
          <Select
            value={filters.sortDirection}
            onChange={handleSortDirectionChange}
            options={[
              { value: OrderDirection.Desc, label: t('filter.orderOptions.descending') },
              { value: OrderDirection.Asc, label: t('filter.orderOptions.ascending') }
            ]}
          />
        </div>

        {/* Results Per Page */}
        <div className="filter-panel__group flex flex-col gap-2">
          <span className="filter-panel__label">{t('filter.perPage')}</span>
          <Select
            value={limit.toString()}
            onChange={(val) => onLimitChange(Number(val))}
            options={[
              { value: '20', label: '20' },
              { value: '25', label: '25' },
              { value: '30', label: '30' },
              { value: '35', label: '35' },
              { value: '40', label: '40' },
              { value: '45', label: '45' },
              { value: '50', label: '50' },
              { value: '55', label: '55' },
              { value: '60', label: '60' },
              { value: '65', label: '65' },
              { value: '70', label: '70' },
              { value: '75', label: '75' },
              { value: '80', label: '80' },
              { value: '85', label: '85' },
              { value: '90', label: '90' },
              { value: '95', label: '95' },
              { value: '100', label: '100' }
            ]}
          />
        </div>
      </div>

      {/* Advanced Filters - a single collapsible accordion item (closed by default; clicking
          its header again closes it) */}
      <Accordion collapsible className="filter-panel__advanced-accordion">
        <AccordionItem value="advanced">
          <AccordionHeader>{t('filter.advancedFilters')}</AccordionHeader>
          <AccordionPanel>
            <div className="filter-panel__advanced">
              {/* Tag Mode Selection */}
              <div className="filter-panel__tag-mode flex items-center gap-3">
                <span className="filter-panel__label">{t('filter.includeTagsMode')}</span>
                <Select
                  value={filters.includedTagsMode}
                  onChange={handleTagModeChange}
                  options={[
                    { value: IncludedTagsMode.AND, label: t('filter.matchAllTags') },
                    { value: IncludedTagsMode.OR, label: t('filter.matchAnyTag') }
                  ]}
                />
              </div>

              {/* Include Tags */}
              <div className="filter-panel__tag-group">
                <h4 className="filter-panel__tag-group-title">{t('filter.tags.includeLabel')}</h4>
                <TagPicker
                  options={flatTagOptions}
                  selectedIds={filters.includedTags}
                  disabledIds={filters.excludedTags}
                  onChange={(ids) => onChange({ includedTags: ids })}
                  placeholder={t('filter.tags.includePlaceholder')}
                  aria-label={t('filter.tags.includeLabel')}
                />
              </div>

              {/* Exclude Tags */}
              <div className="filter-panel__tag-group">
                <h4 className="filter-panel__tag-group-title">{t('filter.tags.excludeLabel')}</h4>
                <TagPicker
                  options={flatTagOptions}
                  selectedIds={filters.excludedTags}
                  disabledIds={filters.includedTags}
                  onChange={(ids) => onChange({ excludedTags: ids })}
                  placeholder={t('filter.tags.excludePlaceholder')}
                  aria-label={t('filter.tags.excludeLabel')}
                />
              </div>

              {/* Language Filter Section */}
              <div className="filter-panel__tag-group">
                <h4 className="filter-panel__tag-group-title">{t('filter.languages')}</h4>
                <div className="filter-panel__tag-list">
                  {LanguageList.map((language) => {
                    const isSelected = filters.availableTranslatedLanguage.includes(language.code)
                    return (
                      <div
                        key={language.code}
                        className="filter-panel__language-item flex items-center"
                      >
                        <Checkbox
                          label={language.name}
                          checked={isSelected}
                          onChange={(checked) => handleLanguageChange(language.code, checked)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
