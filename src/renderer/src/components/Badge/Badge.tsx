import { Badge as FluentBadge } from '@fluentui/react-components'
import { BaseComponentProps } from '@renderer/types/components'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
export type BadgeSize = 'small' | 'medium'

export interface BadgeProps extends BaseComponentProps {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: BadgeVariant

  /**
   * Badge size
   * @default 'medium'
   */
  size?: BadgeSize

  /**
   * Badge content (required unless using dot variant)
   */
  children?: React.ReactNode

  /**
   * Optional icon
   */
  icon?: React.ReactElement

  /**
   * Show as dot instead of full badge
   * @default false
   */
  dot?: boolean
}

/**
 * Badge component for status indicators and labels
 *
 * @example
 * ```tsx
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning" size="small">Ongoing</Badge>
 * <Badge variant="info" icon={<Icon />}>New Chapters</Badge>
 * <Badge variant="error" dot />
 * ```
 */
const VARIANT_TO_COLOR = {
  default: 'subtle',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'brand'
} as const

export function Badge({
  variant = 'default',
  size = 'medium',
  children,
  icon,
  dot = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<BadgeProps>): React.JSX.Element {
  const color = VARIANT_TO_COLOR[variant]

  if (dot) {
    return (
      <FluentBadge
        shape="circular"
        size="tiny"
        color={color}
        className={className}
        aria-label={ariaLabel || 'Status indicator'}
      />
    )
  }

  return (
    <FluentBadge
      shape="rounded"
      size={size}
      color={color}
      icon={icon}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </FluentBadge>
  )
}
