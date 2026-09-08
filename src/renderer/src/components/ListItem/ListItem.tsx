import { BaseComponentProps } from '@renderer/types/components'
import './ListItem.css'

export interface ListProps extends BaseComponentProps {
  /**
   * ListItem children
   */
  children: React.ReactNode
}

/**
 * Container for a group of ListItem rows. Renders a bordered card with a
 * divider automatically inserted between rows - consumers don't need to
 * track which row is last.
 *
 * @example
 * ```tsx
 * <List>
 *   <ListItem title="Row 1" />
 *   <ListItem title="Row 2" />
 * </List>
 * ```
 */
export function List({ children, className = '' }: Readonly<ListProps>): React.JSX.Element {
  const listClasses = ['list', className].filter(Boolean).join(' ')

  return (
    <div className={listClasses} role="list">
      {children}
    </div>
  )
}

export interface ListItemProps extends BaseComponentProps {
  /**
   * Content shown at the start of the row (icon, badge, cover, etc.)
   */
  leading?: React.ReactNode

  /**
   * Primary row text
   */
  title: React.ReactNode

  /**
   * Secondary row text shown below the title
   */
  subtitle?: React.ReactNode

  /**
   * Content shown at the end of the row (actions, value, badge, etc.)
   * Clicks inside this slot never trigger the row's onClick.
   */
  trailing?: React.ReactNode

  /**
   * Makes the row interactive (hover/focus states, keyboard activation)
   */
  onClick?: () => void

  /**
   * Disables interaction and dims the row
   * @default false
   */
  disabled?: boolean
}

/**
 * Single row within a List. Optionally interactive when onClick is provided.
 *
 * @example
 * ```tsx
 * <ListItem
 *   leading={<Badge variant="info">Auto</Badge>}
 *   title="6 September 2026, 14:32"
 *   subtitle="128 MB"
 *   trailing={<Button variant="danger" size="small">Delete</Button>}
 * />
 * ```
 */
export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<ListItemProps>): React.JSX.Element {
  const isInteractive = Boolean(onClick) && !disabled

  const itemClasses = [
    'list-item flex items-center gap-3',
    isInteractive && 'list-item--interactive',
    disabled && 'list-item--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (): void => {
    if (isInteractive) {
      onClick?.()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (!isInteractive) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      className={itemClasses}
      role="listitem"
      tabIndex={isInteractive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
    >
      {leading && (
        <div className="list-item__leading flex items-center justify-center">{leading}</div>
      )}

      <div className="list-item__content">
        <div className="list-item__title">{title}</div>
        {subtitle && <div className="list-item__subtitle">{subtitle}</div>}
      </div>

      {trailing && (
        <div
          className="list-item__trailing flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {trailing}
        </div>
      )}
    </div>
  )
}
