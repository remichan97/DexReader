import { useEffect, useId, useState } from 'react'
import { ChevronUp16Regular, ChevronDown16Regular } from '@fluentui/react-icons'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'
import './NumberSpinner.css'

function clamp(value: number, min?: number, max?: number): number {
  let clamped = value
  if (min !== undefined) clamped = Math.max(min, clamped)
  if (max !== undefined) clamped = Math.min(max, clamped)
  return clamped
}

export interface NumberSpinnerProps extends BaseComponentProps, DisableableProps {
  /**
   * Current value
   */
  value: number

  /**
   * Change handler - only called with a valid, clamped value
   */
  onChange: (value: number) => void

  /**
   * Minimum allowed value (inclusive)
   */
  min?: number

  /**
   * Maximum allowed value (inclusive)
   */
  max?: number

  /**
   * Amount to change per step button press or arrow key
   * @default 1
   */
  step?: number

  /**
   * Label text
   */
  label?: string

  /**
   * Description text below the label
   */
  description?: string

  /**
   * Unit suffix shown inside the field (e.g. "hours")
   */
  suffix?: string

  /**
   * Helper text below the field
   */
  helperText?: string

  /**
   * Error message (shows error state)
   */
  error?: string
}

/**
 * Numeric stepper input following Windows 11 Fluent Design's NumberBox pattern.
 * Clamps to [min, max] before ever calling onChange, so callers never receive
 * an out-of-range value and don't need to re-validate before submitting it.
 *
 * @example
 * ```tsx
 * <NumberSpinner
 *   label="Snapshot interval"
 *   value={intervalInHours}
 *   onChange={setIntervalInHours}
 *   min={1}
 *   max={6}
 *   suffix="hours"
 * />
 * ```
 */
export function NumberSpinner({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  description,
  suffix,
  helperText,
  error,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<NumberSpinnerProps>): React.JSX.Element {
  const [draft, setDraft] = useState(String(value))
  const inputId = useId()
  const helperId = useId()

  // Keep the draft in sync when the value changes from outside (e.g. settings reset)
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const canDecrement = !disabled && (min === undefined || value > min)
  const canIncrement = !disabled && (max === undefined || value < max)

  const commit = (nextValue: number): void => {
    const clamped = clamp(nextValue, min, max)
    setDraft(String(clamped))
    if (clamped !== value) {
      onChange(clamped)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextDraft = event.target.value
    if (/^-?\d*$/.test(nextDraft)) {
      setDraft(nextDraft)
    }
  }

  const commitDraft = (): void => {
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) {
      setDraft(String(value))
      return
    }
    commit(parsed)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (disabled) return

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      commit(value + step)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      commit(value - step)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      commitDraft()
    }
  }

  const hasError = Boolean(error)

  const wrapperClasses = [
    'number-spinner flex flex-col gap-1',
    hasError && 'number-spinner--error',
    disabled && 'number-spinner--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const describedBy = [hasError ? helperId : '', !hasError && helperText ? helperId : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="number-spinner__label">
          {label}
        </label>
      )}
      {description && <p className="number-spinner__description">{description}</p>}

      <div className="number-spinner__field flex items-center">
        <input
          id={inputId}
          className="number-spinner__input"
          type="text"
          inputMode="numeric"
          role="spinbutton"
          value={draft}
          onChange={handleInputChange}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
        />

        {suffix && <span className="number-spinner__suffix">{suffix}</span>}

        <div className="number-spinner__steppers flex flex-col">
          <button
            type="button"
            className="number-spinner__stepper"
            onClick={() => commit(value + step)}
            disabled={!canIncrement}
            tabIndex={-1}
            aria-label={`Increase${label ? ` ${label}` : ''}`}
          >
            <ChevronUp16Regular />
          </button>
          <button
            type="button"
            className="number-spinner__stepper"
            onClick={() => commit(value - step)}
            disabled={!canDecrement}
            tabIndex={-1}
            aria-label={`Decrease${label ? ` ${label}` : ''}`}
          >
            <ChevronDown16Regular />
          </button>
        </div>
      </div>

      {(error || helperText) && (
        <span
          id={helperId}
          className={hasError ? 'number-spinner__error' : 'number-spinner__helper'}
          role={hasError ? 'alert' : undefined}
        >
          {error || helperText}
        </span>
      )}
    </div>
  )
}
