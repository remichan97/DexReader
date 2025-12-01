import { useState, useRef, useEffect } from 'react'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'
import './Select.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends BaseComponentProps, DisableableProps {
  /**
   * Current selected value(s)
   */
  value: string | string[]

  /**
   * Change handler
   */
  onChange: (value: string | string[]) => void

  /**
   * Available options
   */
  options: SelectOption[]

  /**
   * Label text
   */
  label?: string

  /**
   * Placeholder text when no selection
   */
  placeholder?: string

  /**
   * Helper text below the select
   */
  helperText?: string

  /**
   * Error message
   */
  error?: string

  /**
   * Enable multi-select mode
   * @default false
   */
  multiple?: boolean

  /**
   * Enable search/filter
   * @default false
   */
  searchable?: boolean

  /**
   * Custom empty state message
   */
  emptyMessage?: string
}

/**
 * Custom select dropdown component
 *
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   value={country}
 *   onChange={setCountry}
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' }
 *   ]}
 * />
 * ```
 */
export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  helperText,
  error,
  multiple = false,
  searchable = false,
  emptyMessage = 'No options found',
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<SelectProps>): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerInputRef = useRef<HTMLInputElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options

  // Get selected option(s) label
  const getSelectedLabel = (): string => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder
      if (value.length === 1) {
        return options.find((opt) => opt.value === value[0])?.label || placeholder
      }
      return `${value.length} items selected`
    }
    return options.find((opt) => opt.value === value)?.label || placeholder
  }

  // Check if option is selected
  const isSelected = (optionValue: string): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue)
    }
    return value === optionValue
  }

  // Handle option selection
  const handleSelect = (optionValue: string): void => {
    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onChange(newValue)
    } else {
      onChange(optionValue)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault()
          setIsOpen(true)
        } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          e.preventDefault()
          handleSelect(filteredOptions[focusedIndex].value)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
        break

      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1))
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0))
        }
        break

      case 'Home':
        if (isOpen) {
          e.preventDefault()
          setFocusedIndex(0)
        }
        break

      case 'End':
        if (isOpen) {
          e.preventDefault()
          setFocusedIndex(filteredOptions.length - 1)
        }
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus trigger input when dropdown opens (for searchable)
  useEffect(() => {
    if (isOpen && searchable && triggerInputRef.current) {
      triggerInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const option = listboxRef.current.children[focusedIndex] as HTMLElement
      option?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  const containerClasses = [
    'select',
    isOpen && 'select--open',
    error && 'select--error',
    disabled && 'select--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={containerRef} className={containerClasses}>
      {label && (
        <label className="select__label" htmlFor={`select-${label}`}>
          {label}
        </label>
      )}

      {searchable ? (
        // ComboBox pattern: trigger is an editable input
        <div className="select__trigger-container">
          <input
            ref={triggerInputRef}
            type="text"
            className="select__trigger select__trigger--searchable"
            value={isOpen ? searchQuery : getSelectedLabel()}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true)
                setSearchQuery('')
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={ariaLabel || label}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            role="combobox"
          />
          <svg
            className="select__icon"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        // Standard select: trigger is a button
        <button
          ref={triggerButtonRef}
          type="button"
          className="select__trigger"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="select__value">{getSelectedLabel()}</span>
          <svg
            className="select__icon"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="select__dropdown">
          <ul
            ref={listboxRef}
            className="select__listbox"
            role="listbox"
            aria-label={ariaLabel || label}
            aria-multiselectable={multiple}
          >
            {filteredOptions.length === 0 ? (
              <li className="select__option select__option--empty">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={[
                    'select__option',
                    isSelected(option.value) && 'select__option--selected',
                    focusedIndex === index && 'select__option--focused',
                    option.disabled && 'select__option--disabled'
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="option"
                  aria-selected={isSelected(option.value)}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {multiple && (
                    <div className="select__checkbox">
                      {isSelected(option.value) && (
                        <svg
                          className="select__checkmark"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 8L6.5 11.5L13 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  <span className="select__option-label">{option.label}</span>
                  {!multiple && isSelected(option.value) && (
                    <svg
                      className="select__check-icon"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 8L6.5 11.5L13 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {(helperText || error) && <div className="select__helper">{error || helperText}</div>}
    </div>
  )
}
