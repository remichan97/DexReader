import { BaseComponentProps, DisableableProps } from '@renderer/types/components'
import './Checkbox.css'

export interface CheckboxProps extends BaseComponentProps, DisableableProps {
  /**
   * Whether the checkbox is checked
   */
  checked: boolean

  /**
   * Change handler
   */
  onChange: (checked: boolean) => void

  /**
   * Label text
   */
  label?: string

  /**
   * Indeterminate state (partially checked)
   * @default false
   */
  indeterminate?: boolean

  /**
   * Name attribute for form submission
   */
  name?: string

  /**
   * Value attribute for form submission
   */
  value?: string
}

/**
 * Checkbox component with Windows 11 Fluent Design
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={agreed}
 *   onChange={setAgreed}
 *   label="I agree to the terms"
 * />
 * ```
 */
export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
  name,
  value,
  className = '',
  'aria-label': ariaLabel
}: Readonly<CheckboxProps>): React.JSX.Element {
  const handleChange = (): void => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleChange()
    }
  }

  const checkboxClasses = [
    'checkbox',
    checked && 'checkbox--checked',
    indeterminate && 'checkbox--indeterminate',
    disabled && 'checkbox--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <label className={checkboxClasses}>
      <input
        type="checkbox"
        className="checkbox__input"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        name={name}
        value={value}
        aria-label={ariaLabel || label}
        aria-checked={indeterminate ? 'mixed' : checked}
      />
      <div
        className="checkbox__box"
        role="presentation"
        tabIndex={disabled ? undefined : 0}
        onKeyDown={handleKeyDown}
      >
        {indeterminate ? (
          <svg
            className="checkbox__icon checkbox__icon--indeterminate"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          checked && (
            <svg
              className="checkbox__icon checkbox__icon--check"
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
          )
        )}
      </div>
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  )
}
