import { BaseComponentProps, DisableableProps } from '@renderer/types/components'
import './Radio.css'

export interface RadioProps extends BaseComponentProps, DisableableProps {
  /**
   * Radio button value
   */
  value: string

  /**
   * Whether this radio is selected
   * (auto-set by RadioGroup)
   */
  checked?: boolean

  /**
   * Change handler - receives the value when selected
   * (auto-set by RadioGroup)
   */
  onChange?: (value: string) => void

  /**
   * Label text
   */
  label?: string

  /**
   * Description text below the label
   */
  description?: string

  /**
   * Name attribute for form grouping (auto-set by RadioGroup)
   */
  name?: string
}

/**
 * Radio button component with Windows 11 Fluent Design
 *
 * Typically used within a RadioGroup for automatic value management.
 *
 * @example
 * ```tsx
 * <Radio
 *   value="normal"
 *   checked={tier === 'normal'}
 *   onChange={setTier}
 *   label="Normal (200 MB)"
 *   description="3-4 chapters, recommended"
 * />
 * ```
 */
export function Radio({
  value,
  checked,
  onChange,
  label,
  description,
  name,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<RadioProps>): React.JSX.Element {
  const handleChange = (): void => {
    if (!disabled && onChange) {
      onChange(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault()
      handleChange()
    }
  }

  const radioClasses = [
    'radio inline-flex items-start gap-2',
    checked && 'radio--checked',
    disabled && 'radio--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <label className={radioClasses}>
      <input
        type="radio"
        className="radio__input"
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        name={name}
        aria-label={ariaLabel || label}
      />
      <span
        className="radio__circle flex items-center justify-center"
        tabIndex={disabled ? undefined : 0}
        onKeyDown={handleKeyDown}
        aria-hidden="true"
      >
        {checked && <span className="radio__dot" />}
      </span>
      {(label || description) && (
        <div className="radio__content">
          {label && <span className="radio__label">{label}</span>}
          {description && <span className="radio__description">{description}</span>}
        </div>
      )}
    </label>
  )
}
