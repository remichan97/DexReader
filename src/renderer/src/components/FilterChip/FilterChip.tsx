import type { JSX } from 'react'
import './FilterChip.css'

export interface FilterChipProps {
  /** Filter label (e.g., "Status", "Tag") */
  readonly label: string

  /** Filter value (e.g., "Ongoing", "Romance") */
  readonly value: string

  /** Optional className for styling */
  readonly className?: string
}

/**
 * FilterChip component for displaying active filters
 *
 * Shows a read-only chip with label:value format.
 * Used in LibraryView to display active search filters parsed from search query.
 * Users edit the search bar directly to add/remove filters.
 *
 * @example
 * ```tsx
 * <FilterChip label="Status" value="Ongoing" />
 * ```
 */
export function FilterChip({ label, value, className = '' }: FilterChipProps): JSX.Element {
  return (
    <div className={`filter-chip ${className}`}>
      <span className="filter-chip__label">{label}:</span>
      <span className="filter-chip__value">{value}</span>
    </div>
  )
}
