import type { JSX, ReactElement } from 'react'
import { Tooltip as FluentTooltip, type PositioningShorthand } from '@fluentui/react-components'
import { BaseComponentProps } from '@renderer/types/components'

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

const POSITION_MAP: Record<TooltipPosition, PositioningShorthand> = {
  top: 'above',
  right: 'after',
  bottom: 'below',
  left: 'before'
}

export interface TooltipProps extends BaseComponentProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode

  /**
   * Preferred position (auto-flips if near a viewport edge, via Fluent's positioning engine)
   * @default 'top'
   */
  position?: TooltipPosition

  /**
   * Delay before showing the tooltip, in milliseconds
   * @default 500
   */
  delay?: number

  /**
   * Whether the tooltip supplies the trigger's accessible name (`label`, for an otherwise
   * unlabelled icon-only trigger) or supplementary info alongside one the trigger already
   * has (`description`).
   * @default 'description'
   */
  relationship?: 'label' | 'description'

  /**
   * Trigger element
   */
  children: ReactElement
}

/**
 * Tooltip component for hover information, built on Fluent 2's `Tooltip`
 * (@fluentui/react-components). Positioning (including auto-flip near viewport edges)
 * comes from Fluent's `@floating-ui/react`-based engine - the hand-rolled version of this
 * (manual getBoundingClientRect math + a document.body portal) is gone.
 *
 * @example
 * ```tsx
 * <Tooltip content="Click to save your changes">
 *   <Button>Save</Button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  position = 'top',
  delay = 500,
  relationship = 'description',
  children,
  className
}: Readonly<TooltipProps>): JSX.Element {
  return (
    <FluentTooltip
      content={{ children: content, className }}
      positioning={POSITION_MAP[position]}
      showDelay={delay}
      hideDelay={0}
      relationship={relationship}
      withArrow
    >
      {children}
    </FluentTooltip>
  )
}
