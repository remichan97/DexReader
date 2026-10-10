import {
  Field,
  SpinButton,
  makeStyles,
  tokens,
  type SpinButtonChangeEvent,
  type SpinButtonOnChangeData
} from '@fluentui/react-components'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'

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

const useStyles = makeStyles({
  description: {
    margin: 0,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  }
})

/**
 * Numeric stepper input, built on Fluent 2's `Field` + `SpinButton`
 * (@fluentui/react-components). Clamps to [min, max] before ever calling
 * onChange, so callers never receive an out-of-range value and don't need to
 * re-validate before submitting it.
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
  className,
  'aria-label': ariaLabel
}: Readonly<NumberSpinnerProps>): React.JSX.Element {
  const styles = useStyles()
  const hasError = Boolean(error)

  const handleChange = (_event: SpinButtonChangeEvent, data: SpinButtonOnChangeData): void => {
    // SpinButton clamps for the stepper buttons/arrow keys itself (data.value is already a
    // valid number there), but a direct-text-edit commit (blur/Enter) only parses the typed
    // text into data.displayValue, leaving data.value undefined and unclamped - same two-path
    // split the original's commit()/commitDraft() handled explicitly.
    const nextValue =
      typeof data.value === 'number'
        ? data.value
        : data.displayValue !== undefined
          ? Number.parseInt(data.displayValue, 10)
          : NaN

    if (Number.isNaN(nextValue)) return

    const clamped = clamp(nextValue, min, max)
    if (clamped !== value) {
      onChange(clamped)
    }
  }

  return (
    <Field
      className={className}
      label={label}
      validationState={hasError ? 'error' : 'none'}
      validationMessage={hasError ? error : undefined}
      hint={!hasError ? helperText : undefined}
    >
      <>
        {description && <p className={styles.description}>{description}</p>}
        <SpinButton
          value={value}
          displayValue={suffix ? `${value} ${suffix}` : undefined}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={ariaLabel}
          incrementButton={{ 'aria-label': `Increase${label ? ` ${label}` : ''}` }}
          decrementButton={{ 'aria-label': `Decrease${label ? ` ${label}` : ''}` }}
        />
      </>
    </Field>
  )
}
