import { useState, InputHTMLAttributes, useId } from 'react'
import { InputType, BaseComponentProps, DisableableProps } from '@renderer/types/components'
import './Input.css'

export interface InputProps
  extends
    BaseComponentProps,
    DisableableProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'onChange'> {
  /**
   * Input type
   * @default 'text'
   */
  type?: InputType

  /**
   * Input label (optional)
   */
  label?: string

  /**
   * Placeholder text
   */
  placeholder?: string

  /**
   * Current value
   */
  value: string

  /**
   * Change handler
   */
  onChange: (value: string) => void

  /**
   * Error message (shows error state)
   */
  error?: string

  /**
   * Helper text (shown below input)
   */
  helperText?: string

  /**
   * Maximum character length
   */
  maxLength?: number

  /**
   * Show character counter
   */
  showCounter?: boolean

  /**
   * Icon to display at start of input
   */
  icon?: React.ReactNode
}

/**
 * Input component following Windows 11 Fluent Design principles.
 *
 * Features a clean bottom border emphasis on focus with no outer glow,
 * matching Windows 11 native input styling. Supports various input types
 * including password visibility toggle and search with clear button.
 *
 * **Focus Behavior**: Simple 2px accent bottom border with 200ms transition.
 * No scale effects or Material Design patterns - pure Fluent Design.
 *
 * @example
 * ```tsx
 * // Basic text input
 * <Input
 *   type="text"
 *   label="Username"
 *   value={username}
 *   onChange={setUsername}
 *   placeholder="Enter username"
 * />
 *
 * // Password input with error
 * <Input
 *   type="password"
 *   label="Password"
 *   value={password}
 *   onChange={setPassword}
 *   error="Password is required"
 * />
 *
 * // Email with helper text
 * <Input
 *   type="email"
 *   label="Email"
 *   value={email}
 *   onChange={setEmail}
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export function Input({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  maxLength,
  showCounter = false,
  icon,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}: InputProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = useId()
  const errorId = useId()
  const helperId = useId()

  const hasError = Boolean(error)
  const currentLength = value.length
  const hasMaxLength = maxLength !== undefined

  const classNames = [
    'input-wrapper',
    hasError && 'input-wrapper--error',
    disabled && 'input-wrapper--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const inputClassNames = [
    'input',
    icon && 'input--with-icon',
    (type === 'search' || type === 'password') && 'input--with-action'
  ]
    .filter(Boolean)
    .join(' ')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value)
  }

  const handleClear = (): void => {
    onChange('')
  }

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword)
  }

  const inputType = type === 'password' && showPassword ? 'text' : type

  const describedBy = [hasError ? errorId : '', helperText ? helperId : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}

      <div className="input-container">
        {icon && (
          <span className="input-icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          className={inputClassNames}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={maxLength}
          aria-label={ariaLabel || label}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          {...rest}
        />

        {type === 'search' && value && !disabled && (
          <button
            type="button"
            className="input-action input-action--clear"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <svg
              className="input-action-icon"
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

        {type === 'password' && !disabled && (
          <button
            type="button"
            className="input-action input-action--toggle"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            <svg
              className="input-action-icon"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {showPassword ? (
                // Eye icon (visible)
                <>
                  <path
                    d="M8 3C4.5 3 1.5 6 1.5 8s3 5 6.5 5 6.5-3 6.5-5-3-5-6.5-5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </>
              ) : (
                // Eye-off icon (hidden)
                <>
                  <path
                    d="M2 2L14 14M9.5 9.5C9.11 9.89 8.58 10.13 8 10.13c-1.1 0-2-.9-2-2 0-.58.24-1.11.63-1.5M6.5 4.5C7 4.3 7.5 4.2 8 4.2c3.5 0 5.8 3.8 5.8 3.8s-.7 1.4-1.8 2.5M3.2 7.5c.3-.5.7-1 1.1-1.4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {(error || helperText || (showCounter && hasMaxLength)) && (
        <div className="input-footer">
          {hasError && (
            <span id={errorId} className="input-error" role="alert">
              {error}
            </span>
          )}
          {!hasError && helperText && (
            <span id={helperId} className="input-helper">
              {helperText}
            </span>
          )}
          {showCounter && hasMaxLength && (
            <span className="input-counter" aria-live="polite">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
