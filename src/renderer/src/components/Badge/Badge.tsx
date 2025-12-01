import { BaseComponentProps } from '@renderer/types/components'
import './Badge.css'

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
  icon?: React.ReactNode

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
export function Badge({
  variant = 'default',
  size = 'medium',
  children,
  icon,
  dot = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<BadgeProps>): React.JSX.Element {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    dot && 'badge--dot',
    className
  ]
    .filter(Boolean)
    .join(' ')

  if (dot) {
    return <span className={badgeClasses} aria-label={ariaLabel || 'Status indicator'} />
  }

  return (
    <span className={badgeClasses} aria-label={ariaLabel}>
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__content">{children}</span>
    </span>
  )
}
