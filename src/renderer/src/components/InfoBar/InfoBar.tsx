import type { JSX, ReactNode } from 'react'
import './InfoBar.css'

export interface InfoBarProps {
  /**
   * Text to display in the info bar
   */
  readonly text: string

  /**
   * Action buttons or elements to display on the right
   */
  readonly actions?: ReactNode

  /**
   * Whether the info bar is visible
   * @default true
   */
  readonly visible?: boolean

  /**
   * Callback when info bar is dismissed (if dismissible)
   */
  readonly onDismiss?: () => void

  /**
   * Additional CSS class name
   */
  readonly className?: string
}

/**
 * InfoBar Component
 *
 * A sticky information bar that appears at the top of the viewport.
 * Follows Windows 11 Fluent Design principles with smooth animations.
 *
 * @example
 * ```tsx
 * <InfoBar
 *   text="3 filters active"
 *   actions={
 *     <>
 *       <Button variant="ghost" size="small" onClick={handleScroll}>
 *         Scroll to Filters
 *       </Button>
 *       <Button variant="secondary" size="small" onClick={handleReset}>
 *         Reset
 *       </Button>
 *     </>
 *   }
 * />
 * ```
 */
export function InfoBar({
  text,
  actions,
  visible = true,
  className = ''
}: InfoBarProps): JSX.Element | null {
  if (!visible) return null

  return (
    <div className={`info-bar ${className}`}>
      <div className="info-bar__content">
        <span className="info-bar__text">{text}</span>
        {actions && <div className="info-bar__actions">{actions}</div>}
      </div>
    </div>
  )
}
