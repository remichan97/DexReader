import { useState, useEffect, useRef } from 'react'
import { BaseComponentProps } from '@renderer/types/components'
import { useDebounce } from '@renderer/hooks/useDebounce'
import './SearchBar.css'

export interface SearchBarProps extends BaseComponentProps {
  /**
   * Current search value
   */
  value: string

  /**
   * Change handler (called after debounce)
   */
  onChange: (value: string) => void

  /**
   * Filter button click handler
   */
  onFilterClick?: () => void

  /**
   * Number of active filters
   */
  filterCount?: number

  /**
   * Placeholder text
   * @default 'Search...'
   */
  placeholder?: string

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number

  /**
   * Disabled state
   */
  disabled?: boolean
}

/**
 * SearchBar component with debouncing and filter support.
 *
 * Styled to match the Input component exactly (32px height, 2px bottom border).
 * Features clean focus behavior with bottom border emphasis only - no outer glow.
 * Includes keyboard shortcuts (Ctrl+F to focus, Escape to clear).
 *
 * **Focus Behavior**: Identical to Input component - 2px accent bottom border
 * with :not(:focus-within) on hover to prevent border conflicts.
 *
 * @example
 * ```tsx
 * // Basic search
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search manga..."
 * />
 *
 * // With filters
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onFilterClick={handleOpenFilters}
 *   filterCount={3}
 *   debounceMs={500}
 * />
 * ```
 */
export function SearchBar({
  value,
  onChange,
  onFilterClick,
  filterCount = 0,
  placeholder = 'Search...',
  debounceMs = 300,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: SearchBarProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState(value)
  const debouncedValue = useDebounce(internalValue, debounceMs)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Call onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Ctrl+F to focus search
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault()
        inputRef.current?.focus()
      }

      // Escape to clear (only when input is focused)
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        event.preventDefault()
        handleClear()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setInternalValue(event.target.value)
  }

  const handleClear = (): void => {
    setInternalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const handleFilterClick = (): void => {
    onFilterClick?.()
  }

  const classNames = ['search-bar', disabled && 'search-bar--disabled', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      <div className="search-bar__container">
        {/* Search Icon */}
        <span className="search-bar__icon" aria-hidden="true">
          <svg
            className="search-bar__icon-svg"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="search"
          className="search-bar__input"
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel || 'Search'}
          autoComplete="off"
        />

        {/* Clear Button */}
        {internalValue && !disabled && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <svg
              className="search-bar__clear-icon"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Filter Button */}
        {onFilterClick && (
          <button
            type="button"
            className="search-bar__filter"
            onClick={handleFilterClick}
            disabled={disabled}
            aria-label={`Filters${filterCount > 0 ? ` (${filterCount} active)` : ''}`}
          >
            <svg
              className="search-bar__filter-icon"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4h16M5 10h10M8 16h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {filterCount > 0 && <span className="search-bar__filter-badge">{filterCount}</span>}
          </button>
        )}
      </div>

      {/* Helper Text */}
      {!disabled && (
        <div className="search-bar__hint" aria-live="polite" aria-atomic="true">
          Press <kbd>Ctrl+F</kbd> to focus, <kbd>Esc</kbd> to clear
        </div>
      )}
    </div>
  )
}
