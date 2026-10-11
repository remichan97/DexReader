import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import {
  Button,
  CounterBadge,
  SearchBox,
  makeStyles,
  mergeClasses,
  type InputOnChangeData,
  type SearchBoxChangeEvent
} from '@fluentui/react-components'
import { Filter20Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { BaseComponentProps } from '@renderer/types/components'
import { useDebounce } from '@renderer/hooks/useDebounce'

const useStyles = makeStyles({
  // Fluent's SearchBox caps its root at 468px; our views want it to fill whatever row
  // (or flex slot) it's placed in.
  searchBox: {
    width: '100%',
    maxWidth: 'none',
    // Fluent moves the right padding from the root (focused) to the input (unfocused), which
    // slides the trailing buttons 8px every time the box gains or loses focus. Pin it.
    paddingRight: '4px'
  },
  // The dismiss span is 24px tall but leaves its 20px icon top-aligned, 2px above the
  // centred button icons next to it.
  dismiss: {
    alignItems: 'center'
  },
  // SearchBox collapses its contentAfter slot to 0x0 until the box is focused (it expects
  // transient content). The filter/toggle buttons here must always be visible, so undo that.
  contentAfter: {
    width: 'auto',
    height: 'auto',
    overflow: 'visible',
    paddingLeft: '4px'
  },
  // The badge sits beside the button, not inside it: as button content it would make Fluent
  // treat this as a labelled button, stretching it (24px -> 64px) and pinning the badge to the
  // far corner, away from the icon. Anchoring both to this wrapper keeps the button icon-only.
  filterAnchor: {
    position: 'relative',
    display: 'inline-flex'
  },
  filterBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    pointerEvents: 'none'
  }
})

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

  /**
   * Extra controls rendered inside the search box, after the clear button
   * (e.g. toggle buttons). The filter button, when shown, comes last.
   */
  actions?: ReactNode
}

/**
 * SearchBar component with debouncing and filter support, built on Fluent 2's `SearchBox`
 * (@fluentui/react-components). The search icon, clear (dismiss) button, focus underline,
 * and disabled styling all come from Fluent - the hand-rolled icon, clear button and
 * border/focus CSS are gone. What stays here is DexReader behaviour: debounced `onChange`,
 * immediate propagation of a clear, Ctrl+F to focus, Escape to clear, and the filter button
 * with its active-filter count.
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
  placeholder,
  debounceMs = 300,
  disabled = false,
  actions,
  className,
  'aria-label': ariaLabel
}: SearchBarProps): React.JSX.Element {
  const { t } = useTranslation()
  const styles = useStyles()
  const [internalValue, setInternalValue] = useState(value)
  const debouncedValue = useDebounce(internalValue, debounceMs)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Call onChange when debounced value changes
  // Only trigger if debouncedValue matches current internalValue (prevents stale updates after clear)
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue === internalValue) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value, internalValue])

  const handleClear = useCallback((): void => {
    // Update local state immediately for visual feedback
    setInternalValue('')
    // Notify parent to update query
    onChange('')
    inputRef.current?.focus()
  }, [onChange])

  const handleChange = (_event: SearchBoxChangeEvent, data: InputOnChangeData): void => {
    setInternalValue(data.value)
    // Fluent's dismiss button reports a clear as an empty value; propagate it immediately
    // (as handleClear does) rather than waiting out the debounce.
    if (data.value === '') {
      onChange('')
    }
  }

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
  }, [handleClear])

  const filterLabel =
    filterCount > 0
      ? `${t('aria.filters')} (${t('aria.filtersActive', { count: filterCount })})`
      : t('aria.filters')

  return (
    <SearchBox
      ref={inputRef}
      className={mergeClasses(styles.searchBox, className)}
      placeholder={placeholder || t('form.placeholder.search')}
      value={internalValue}
      onChange={handleChange}
      disabled={disabled}
      aria-label={ariaLabel || t('action.search')}
      autoComplete="off"
      // Only offer the clear button when there's something to clear. (With contentAfter
      // present Fluent always renders it, and its default aria-label is untranslated.)
      dismiss={
        internalValue && !disabled
          ? { 'aria-label': t('aria.clearSearch'), className: styles.dismiss }
          : null
      }
      contentAfter={
        actions || onFilterClick
          ? {
              className: styles.contentAfter,
              children: (
                <>
                  {actions}
                  {onFilterClick && (
                    <span className={styles.filterAnchor}>
                      <Button
                        appearance="transparent"
                        size="small"
                        icon={<Filter20Regular />}
                        onClick={onFilterClick}
                        disabled={disabled}
                        aria-label={filterLabel}
                      />
                      {filterCount > 0 && (
                        <CounterBadge
                          className={styles.filterBadge}
                          count={filterCount}
                          size="small"
                          color="brand"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  )}
                </>
              )
            }
          : undefined
      }
    />
  )
}
