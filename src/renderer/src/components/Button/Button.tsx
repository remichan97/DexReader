import { ButtonHTMLAttributes } from 'react'
import {
  Button as FluentButton,
  makeStyles,
  mergeClasses,
  shorthands,
  type ButtonProps as FluentButtonProps
} from '@fluentui/react-components'
import {
  ButtonVariant,
  ComponentSize,
  BaseComponentProps,
  DisableableProps,
  LoadableProps
} from '@renderer/types/components'
import { ProgressRing } from '../ProgressRing'
import { useTranslation } from '@renderer/hooks/useTranslation'

export interface ButtonProps
  extends
    BaseComponentProps,
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
  icon?: React.ReactElement

  /**
   * Button content (optional for icon-only buttons)
   */
  children?: React.ReactNode

  /**
   * Button type
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'
}

// Fluent's Button has no built-in "danger"/"warning" appearance (those are MessageBar/Badge
// intents, not Button ones), so they're layered on top of appearance="primary" with the same
// --win-error/--win-warning tokens the hand-rolled variants used, rather than introducing new
// Fluent status-palette tokens that could shift the colour. Pseudo-selector shape mirrors
// Fluent's own primary appearance (see @fluentui/react-button's useButtonStyles.styles.raw.js)
// so active/focus precedence behaves the same as every other appearance.
const useVariantStyles = makeStyles({
  danger: {
    backgroundColor: 'var(--win-error)',
    ...shorthands.borderColor('var(--win-error)'),
    ':hover': {
      backgroundColor: 'var(--win-error-hover)',
      ...shorthands.borderColor('var(--win-error-hover)')
    },
    ':hover:active': {
      backgroundColor: 'var(--win-error-active)',
      ...shorthands.borderColor('var(--win-error-active)')
    }
  },
  warning: {
    backgroundColor: 'var(--win-warning)',
    ...shorthands.borderColor('var(--win-warning)'),
    ':hover': {
      backgroundColor: 'var(--win-warning-hover)',
      ...shorthands.borderColor('var(--win-warning-hover)')
    },
    ':hover:active': {
      backgroundColor: 'var(--win-warning-hover)',
      ...shorthands.borderColor('var(--win-warning-hover)')
    }
  }
})

const APPEARANCE_BY_VARIANT: Record<ButtonVariant, FluentButtonProps['appearance']> = {
  primary: 'primary',
  accent: 'primary',
  secondary: 'secondary',
  ghost: 'subtle',
  danger: 'primary',
  warning: 'primary'
}

/**
 * Button component, built on Fluent 2's `Button` (@fluentui/react-components).
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
  className,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: Readonly<ButtonProps>): React.JSX.Element {
  const { t } = useTranslation('common')
  const variantStyles = useVariantStyles()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled || loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <FluentButton
      type={type}
      appearance={APPEARANCE_BY_VARIANT[variant]}
      size={size}
      className={mergeClasses(
        (variant === 'danger' || variant === 'warning') && variantStyles[variant],
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      icon={loading ? <ProgressRing size="small" aria-label={t('state.loading')} /> : icon}
      {...rest}
    >
      {children}
    </FluentButton>
  )
}
