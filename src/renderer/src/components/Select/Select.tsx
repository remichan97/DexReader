import type { JSX } from 'react'
import {
  Field,
  Dropdown,
  Option,
  type OptionOnSelectData,
  type SelectionEvents
} from '@fluentui/react-components'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends BaseComponentProps, DisableableProps {
  /**
   * Current selected value
   */
  value: string

  /**
   * Change handler
   */
  onChange: (value: string) => void

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
}

/**
 * Select component, built on Fluent 2's `Field` + `Dropdown` (@fluentui/react-components).
 * Positioning (including auto-flip near viewport edges), keyboard navigation (arrow keys,
 * Home/End, type-to-find), click-outside/Escape dismissal, and the trigger button's own
 * expand icon all come from Fluent - the hand-rolled versions of all of these (manual
 * getBoundingClientRect flip math, a focused-index keyboard handler, a document mousedown
 * listener) are gone.
 *
 * Narrower than the original: `multiple`, `searchable`, `error`, and `emptyMessage` were
 * dropped - confirmed zero real call sites used any of them (every consumer is a plain
 * single-value select), same call made for `ProgressRing`'s unused props in Tier 1. Add
 * them back (multiselect via Fluent's own `multiselect` prop, searchable by swapping to
 * Fluent's `Combobox`) if a real use case shows up.
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
  placeholder,
  helperText,
  disabled = false,
  className,
  'aria-label': ariaLabel
}: Readonly<SelectProps>): JSX.Element {
  const selectedOption = options.find((option) => option.value === value)

  const handleOptionSelect = (_event: SelectionEvents, data: OptionOnSelectData): void => {
    if (data.optionValue !== undefined) {
      onChange(data.optionValue)
    }
  }

  return (
    <Field className={className} label={label} hint={helperText}>
      <Dropdown
        value={selectedOption?.label}
        selectedOptions={selectedOption ? [selectedOption.value] : []}
        onOptionSelect={handleOptionSelect}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Option>
        ))}
      </Dropdown>
    </Field>
  )
}
