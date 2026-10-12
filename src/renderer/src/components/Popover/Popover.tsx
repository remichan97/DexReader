import type { JSX, ReactElement, ReactNode } from 'react'
import {
  Popover as FluentPopover,
  PopoverTrigger as FluentPopoverTrigger,
  PopoverSurface,
  type PositioningShorthand
} from '@fluentui/react-components'
import { BaseComponentProps } from '@renderer/types/components'

export type PopoverPosition = 'top' | 'right' | 'bottom' | 'left'
export type PopoverTrigger = 'click' | 'hover'

const POSITION_MAP: Record<PopoverPosition, PositioningShorthand> = {
  top: 'above',
  right: 'after',
  bottom: 'below',
  left: 'before'
}

export interface PopoverProps extends BaseComponentProps {
  /**
   * Popover content
   */
  content: ReactNode

  /**
   * Preferred position (auto-flips if near a viewport edge, via Fluent's positioning engine)
   * @default 'bottom'
   */
  position?: PopoverPosition

  /**
   * Trigger type
   * @default 'click'
   */
  trigger?: PopoverTrigger

  /**
   * Controlled open state
   */
  open?: boolean

  /**
   * Called when open state changes
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Trigger element
   */
  children: ReactElement
}

/**
 * Popover component for contextual menus and content, built on Fluent 2's
 * `Popover`/`PopoverTrigger`/`PopoverSurface` (@fluentui/react-components). Positioning
 * (including auto-flip near viewport edges), click-outside dismissal, Escape-to-close, and
 * focus restore to the trigger on close all come from Fluent's `@floating-ui/react`-based
 * engine - the hand-rolled versions of all of these (manual getBoundingClientRect math, a
 * document mousedown/keydown listener pair, a document.body portal) are gone.
 *
 * @example
 * ```tsx
 * <Popover content={<div>Popover content</div>}>
 *   <Button>Open Popover</Button>
 * </Popover>
 * ```
 */
export function Popover({
  content,
  position = 'bottom',
  trigger = 'click',
  open,
  onOpenChange,
  children,
  className
}: Readonly<PopoverProps>): JSX.Element {
  return (
    <FluentPopover
      open={open}
      onOpenChange={(_event, data) => onOpenChange?.(data.open)}
      positioning={POSITION_MAP[position]}
      openOnHover={trigger === 'hover'}
      mouseLeaveDelay={100}
      withArrow
    >
      <FluentPopoverTrigger disableButtonEnhancement>{children}</FluentPopoverTrigger>
      <PopoverSurface className={className}>{content}</PopoverSurface>
    </FluentPopover>
  )
}
