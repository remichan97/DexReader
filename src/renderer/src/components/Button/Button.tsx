import { ButtonHTMLAttributes } from 'react'
import {
  ButtonVariant,
  ComponentSize,
  BaseComponentProps,
  DisableableProps,
  LoadableProps
} from '@renderer/types/components'
import { ProgressRing } from '../ProgressRing'
import './Button.css'

export interface ButtonProps
  extends BaseComponentProps,
    DisableableProps,
    LoadableProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /**
   * Button visual variant
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * Button size
   * @default 'medium'
   */
  size?: ComponentSize

  /**
   * Icon to display before button text
   */
  icon?: React.ReactNode

  /**
   * Button content
   */
  children: React.ReactNode

  /**
   * Button type
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'
}

/**
 * Button component following Windows 11 design principles
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="medium" onClick={handleClick}>
 *   Save Changes
 * </Button>
 *
 * <Button variant="secondary" icon={<Icon />} loading>
 *   Loading...
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  children,
  type = 'button',
  className = '',
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: ButtonProps): React.JSX.Element {
  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled && 'button--disabled',
    loading && 'button--loading',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled || loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...rest}
    >
      {loading && (
        <span className="button__spinner" aria-hidden="true">
          <ProgressRing size="small" aria-label="Loading" />
        </span>
      )}
      {!loading && icon && (
        <span className="button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="button__content">{children}</span>
    </button>
  )
}
