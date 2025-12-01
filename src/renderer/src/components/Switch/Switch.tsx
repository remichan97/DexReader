import { useId } from 'react'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'
import './Switch.css'

export interface SwitchProps extends BaseComponentProps, DisableableProps {
  /**
   * Whether the switch is checked
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
   * Description text below the label
   */
  description?: string
}

/**
 * Toggle switch component for settings
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={enabled}
 *   onChange={setEnabled}
 *   label="Enable notifications"
 *   description="Receive notifications when new chapters are available"
 * />
 * ```
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<SwitchProps>): React.JSX.Element {
  const id = useId()

  const handleClick = (): void => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (disabled) return

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
  }

  const switchClasses = [
    'switch',
    checked && 'switch--checked',
    disabled && 'switch--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={switchClasses}>
      <div className="switch__control">
        {(label || description) && (
          <div className="switch__content">
            {label && (
              <label htmlFor={id} className="switch__label">
                {label}
              </label>
            )}
            {description && <p className="switch__description">{description}</p>}
          </div>
        )}

        <button
          type="button"
          role="switch"
          id={id}
          className="switch__button"
          aria-checked={checked}
          aria-label={ariaLabel || label}
          disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <span className="switch__track">
            <span className="switch__knob" />
          </span>
        </button>
      </div>
    </div>
  )
}
