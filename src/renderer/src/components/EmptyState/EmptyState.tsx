import { JSX } from 'react'
import { Button } from '../Button'
import './EmptyState.css'

export interface EmptyStateProps {
  /**
   * Icon to display above the message (Fluent UI icon component)
   * @example <BookOpen48Regular />
   */
  icon?: React.ReactNode

  /**
   * Optional title/heading for the empty state
   * @example "No reading history yet"
   */
  title?: string

  /**
   * Main message describing the empty state
   * @example "Start reading manga to see your progress here."
   */
  message: string

  /**
   * Optional action button configuration
   */
  action?: {
    /** Button label */
    label: string
    /** Button click handler */
    onClick: () => void
    /** Button variant */
    variant?: 'primary' | 'secondary'
  }

  /**
   * Visual variant of the empty state
   * - 'default': Standard empty state with low-opacity icon
   * - 'search': Empty search results with different icon treatment
   * @default 'default'
   */
  variant?: 'search' | 'default'
}

/**
 * EmptyState component for displaying empty states across views
 *
 * Provides consistent UX for empty lists, search results, and collections
 * with optional icon, title, message, and action button.
 *
 * @example
 * // Simple empty state
 * <EmptyState
 *   icon={<BookOpen48Regular />}
 *   message="No favourites yet!"
 * />
 *
 * @example
 * // Empty state with title and action
 * <EmptyState
 *   icon={<History24Regular />}
 *   title="No reading history yet"
 *   message="Start reading manga to see your progress here."
 *   action={{
 *     label: 'Browse Manga',
 *     onClick: () => navigate('/browse'),
 *     variant: 'primary'
 *   }}
 * />
 *
 * @example
 * // Search results empty state
 * <EmptyState
 *   icon={<Search48Regular />}
 *   message="No results found for your search."
 *   variant="search"
 * />
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  variant = 'default'
}: Readonly<EmptyStateProps>): JSX.Element {
  return (
    <div className={`empty-state empty-state--${variant}`} role="status" aria-live="polite">
      {icon && <div className="empty-state__icon">{icon}</div>}

      {title && <h2 className="empty-state__title">{title}</h2>}

      <p className="empty-state__message">{message}</p>

      {action && (
        <Button variant={action.variant ?? 'primary'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
