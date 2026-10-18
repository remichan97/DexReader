import type { JSX, ReactNode } from 'react'
import {
  MessageBar,
  MessageBarBody,
  MessageBarActions,
  makeStyles,
  mergeClasses
} from '@fluentui/react-components'

export interface InfoBarProps {
  /**
   * Text to display in the info bar (can be string or JSX)
   */
  readonly text: ReactNode

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

// Fluent's MessageBar has no sticky/positioning concept of its own, so this adds
// `position: sticky; top: 0`, which every call site relies on to stay visible while the page
// scrolls past it.
const useStyles = makeStyles({
  sticky: {
    position: 'sticky',
    top: 0,
    zIndex: 10
  }
})

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
  const styles = useStyles()

  if (!visible) return null

  return (
    <MessageBar intent="info" className={mergeClasses(styles.sticky, className)}>
      <MessageBarBody>{text}</MessageBarBody>
      {actions && <MessageBarActions>{actions}</MessageBarActions>}
    </MessageBar>
  )
}
