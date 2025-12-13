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
  type SearchFilters
} from '@renderer/stores/searchStore'
import './FilterPanel.css'

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (filters: Partial<SearchFilters>) => void
  onApply: () => void
  onClear: () => void
}

export function FilterPanel({
  filters,
  onChange,
  onApply,
  onClear
}: FilterPanelProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)

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
          {isExpanded ? '▼' : '▶'} Advanced Filters (Tags)
        </button>
      </div>

      {/* Advanced Filters Section */}
      {isExpanded && (
        <div className="filter-panel__advanced">
          <div className="filter-panel__tag-section">
            <p style={{ color: 'var(--win-text-secondary)', fontSize: '14px' }}>
              Tag filtering coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
