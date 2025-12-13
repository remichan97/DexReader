/**
 * Filter Panel Component
 *
 * Horizontal filter bar for manga search with content rating, status,
 * demographic, and sort options. Spans full width like SearchBar.
 */

import type { JSX } from 'react'
import { useState } from 'react'
import { Select } from '@renderer/components/Select'
import { Checkbox } from '@renderer/components/Checkbox'
import { Button } from '@renderer/components/Button'
import {
  ContentRating,
  PublicationStatus,
  PublicationDemographic,
  OrderOptions,
  OrderDirection,
  IncludedTagsMode,
  type SearchFilters
} from '@renderer/stores/searchStore'
import { getAllTagsGrouped } from '@renderer/utils/tagHelpers'
import { LanguageList } from '@renderer/constants/language-list.constant'
import './FilterPanel.css'

interface FilterPanelProps {
  readonly filters: SearchFilters
  readonly limit: number
  readonly onChange: (filters: Partial<SearchFilters>) => void
  readonly onLimitChange: (limit: number) => void
  readonly onApply: () => void
  readonly onClear: () => void
}

export function FilterPanel({
  filters,
  limit,
  onChange,
  onLimitChange,
  onApply,
  onClear
}: FilterPanelProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const tagGroups = getAllTagsGrouped()

  const handleContentRatingChange = (rating: ContentRating, checked: boolean): void => {
    const newRatings = checked
      ? [...filters.contentRating, rating]
      : filters.contentRating.filter((r) => r !== rating)
    onChange({ contentRating: newRatings })
  }

  const handleStatusChange = (value: string | string[]): void => {
    const val = Array.isArray(value) ? value[0] : value
    const statuses = val === 'all' ? [] : [val as PublicationStatus]
    onChange({ publicationStatus: statuses })
  }

  const handleDemographicChange = (value: string | string[]): void => {
    const val = Array.isArray(value) ? value[0] : value
    const demographics = val === 'all' ? [] : [val as PublicationDemographic]
    onChange({ publicationDemographic: demographics })
  }

  const handleSortChange = (value: string | string[]): void => {
    const val = Array.isArray(value) ? value[0] : value
    onChange({ sortBy: val as OrderOptions })
  }

  const handleSortDirectionChange = (value: string | string[]): void => {
    const val = Array.isArray(value) ? value[0] : value
    onChange({ sortDirection: val as OrderDirection })
  }

  const handleTagInclude = (tagId: string, checked: boolean): void => {
    const newTags = checked
      ? [...filters.includedTags, tagId]
      : filters.includedTags.filter((id) => id !== tagId)
    onChange({ includedTags: newTags })
  }

  const handleTagExclude = (tagId: string, checked: boolean): void => {
    const newTags = checked
      ? [...filters.excludedTags, tagId]
      : filters.excludedTags.filter((id) => id !== tagId)
    onChange({ excludedTags: newTags })
  }

  const handleTagModeChange = (value: string | string[]): void => {
    const val = Array.isArray(value) ? value[0] : value
    onChange({ includedTagsMode: val as IncludedTagsMode })
  }

  const handleLanguageChange = (languageCode: string, checked: boolean): void => {
    const newLanguages = checked
      ? [...filters.availableTranslatedLanguage, languageCode]
      : filters.availableTranslatedLanguage.filter((code) => code !== languageCode)
    onChange({ availableTranslatedLanguage: newLanguages })
  }

  // Calculate active filter count (excluding sort)
  const activeFilterCount =
    filters.contentRating.length +
    filters.publicationStatus.length +
    filters.publicationDemographic.length +
    filters.includedTags.length +
    filters.excludedTags.length

  return (
    <div className="filter-panel">
      {/* Quick Filters Row */}
      <div className="filter-panel__quick">
        {/* Content Rating */}
        <div className="filter-panel__group">
          <span className="filter-panel__label">Content Rating</span>
          <div className="filter-panel__checkboxes">
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Safe)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Safe, checked)}
              label="Safe"
            />
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Suggestive)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Suggestive, checked)}
              label="Suggestive"
            />
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Erotica)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Erotica, checked)}
              label="Erotica"
            />
            <Checkbox
              checked={filters.contentRating.includes(ContentRating.Pornographic)}
              onChange={(checked) => handleContentRatingChange(ContentRating.Pornographic, checked)}
              label="Pornographic"
            />
          </div>
        </div>

        {/* Status */}
        <div className="filter-panel__group">
          <span className="filter-panel__label">Status</span>
          <Select
            value={filters.publicationStatus[0] || 'all'}
            onChange={handleStatusChange}
            options={[
              { value: 'all', label: 'All' },
              { value: PublicationStatus.Ongoing, label: 'Ongoing' },
              { value: PublicationStatus.Completed, label: 'Completed' },
              { value: PublicationStatus.Hiatus, label: 'Hiatus' },
              { value: PublicationStatus.Cancelled, label: 'Cancelled' }
            ]}
          />
        </div>

        {/* Demographic */}
        <div className="filter-panel__group">
          <span className="filter-panel__label">Demographic</span>
          <Select
            value={filters.publicationDemographic[0] || 'all'}
            onChange={handleDemographicChange}
            options={[
              { value: 'all', label: 'All' },
              { value: PublicationDemographic.Shounen, label: 'Shounen' },
              { value: PublicationDemographic.Shoujo, label: 'Shoujo' },
              { value: PublicationDemographic.Seinen, label: 'Seinen' },
              { value: PublicationDemographic.Josei, label: 'Josei' },
              { value: PublicationDemographic.None, label: 'None' }
            ]}
          />
        </div>

        {/* Sort By */}
        <div className="filter-panel__group">
          <span className="filter-panel__label">Sort By</span>
          <Select
            value={filters.sortBy}
            onChange={handleSortChange}
            options={[
              { value: OrderOptions.Relevance, label: 'Relevance' },
              { value: OrderOptions.UpdatedAt, label: 'Latest Update' },
              { value: OrderOptions.CreatedAt, label: 'Recently Added' },
              { value: OrderOptions.FollowedCount, label: 'Most Follows' },
              { value: OrderOptions.Rating, label: 'Highest Rated' },
              { value: OrderOptions.Title, label: 'Title' },
              { value: OrderOptions.Year, label: 'Year' }
            ]}
          />
        </div>

        {/* Sort Direction */}
        <div className="filter-panel__group">
          <span className="filter-panel__label">Order</span>
          <Select
            value={filters.sortDirection}
            onChange={handleSortDirectionChange}
            options={[
              { value: OrderDirection.Desc, label: 'Descending' },
              { value: OrderDirection.Asc, label: 'Ascending' }
            ]}
          />
        </div>

        {/* Results Per Page */}
        <div className="filter-panel__group">
          <span className="filter-panel__label">Per Page</span>
          <Select
            value={limit.toString()}
            onChange={(val) => onLimitChange(Number(Array.isArray(val) ? val[0] : val))}
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

        {/* Action Buttons */}
        <div className="filter-panel__actions">
          <Button variant="secondary" size="small" onClick={onClear}>
            Clear ({activeFilterCount})
          </Button>
          <Button variant="primary" size="small" onClick={onApply}>
            Apply
          </Button>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="filter-panel__advanced-toggle">
        <button
          className="filter-panel__toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
        >
          {isExpanded ? '▼' : '▶'} Advanced Filters (Tags & Languages)
        </button>
      </div>

      {/* Advanced Filters Section */}
      {isExpanded && (
        <div className="filter-panel__advanced">
          {/* Tag Mode Selection */}
          <div className="filter-panel__tag-mode">
            <span className="filter-panel__label">Include Tags Mode:</span>
            <Select
              value={filters.includedTagsMode}
              onChange={handleTagModeChange}
              options={[
                { value: IncludedTagsMode.And, label: 'Match ALL tags (AND)' },
                { value: IncludedTagsMode.Or, label: 'Match ANY tag (OR)' }
              ]}
            />
          </div>

          {/* Tag Groups */}
          {Object.entries(tagGroups).map(([groupName, tags]) => (
            <div key={groupName} className="filter-panel__tag-group">
              <h4 className="filter-panel__tag-group-title">{groupName}</h4>
              <div className="filter-panel__tag-grid">
                {tags.map((tag) => {
                  const isIncluded = filters.includedTags.includes(tag.id)
                  const isExcluded = filters.excludedTags.includes(tag.id)

                  return (
                    <div key={tag.id} className="filter-panel__tag-item">
                      <span className="filter-panel__tag-name">{tag.name}</span>
                      <div className="filter-panel__tag-controls">
                        <button
                          type="button"
                          className={`filter-panel__tag-btn include ${isIncluded ? 'active' : ''}`}
                          onClick={() => {
                            // Remove from excluded if present
                            if (isExcluded) {
                              handleTagExclude(tag.id, false)
                            }
                            handleTagInclude(tag.id, !isIncluded)
                          }}
                          title="Include this tag"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className={`filter-panel__tag-btn exclude ${isExcluded ? 'active' : ''}`}
                          onClick={() => {
                            // Remove from included if present
                            if (isIncluded) {
                              handleTagInclude(tag.id, false)
                            }
                            handleTagExclude(tag.id, !isExcluded)
                          }}
                          title="Exclude this tag"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Language Filter Section */}
          <div className="filter-panel__tag-group">
            <h4 className="filter-panel__tag-group-title">Languages</h4>
            <div className="filter-panel__tag-list">
              {LanguageList.map((language) => {
                const isSelected = filters.availableTranslatedLanguage.includes(language.code)
                return (
                  <div key={language.code} className="filter-panel__language-item">
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
      )}
    </div>
  )
}
