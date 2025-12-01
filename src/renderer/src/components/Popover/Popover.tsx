import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BaseComponentProps } from '@renderer/types/components'
import './Popover.css'

export type PopoverPosition = 'top' | 'right' | 'bottom' | 'left'
export type PopoverTrigger = 'click' | 'hover'

export interface PopoverProps extends BaseComponentProps {
  /**
   * Popover content
   */
  content: React.ReactNode

  /**
   * Preferred position (will auto-flip if near edge)
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
  children: React.ReactElement
}

/**
 * Popover component for contextual menus and content
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
  open: controlledOpen,
  onOpenChange,
  children,
  className = ''
}: Readonly<PopoverProps>): React.JSX.Element {
  const [internalOpen, setInternalOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const [actualPosition, setActualPosition] = useState(position)
  const triggerRef = useRef<HTMLElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isOpen = controlledOpen ?? internalOpen

  const setIsOpen = React.useCallback(
    (open: boolean): void => {
      if (controlledOpen === undefined) {
        setInternalOpen(open)
      }
      onOpenChange?.(open)
    },
    [controlledOpen, onOpenChange]
  )

  const calculatePosition = React.useCallback((): void => {
    if (!triggerRef.current || !popoverRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()
    const gap = 8

    let top = 0
    let left = 0
    let finalPosition = position

    // Calculate initial position
    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - gap
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + gap
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
        left = triggerRect.left - popoverRect.width - gap
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
        left = triggerRect.right + gap
        break
    }

    // Auto-flip if near viewport edges
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8

    // Constrain horizontally
    if (left < padding) {
      left = padding
    } else if (left + popoverRect.width > viewportWidth - padding) {
      left = viewportWidth - popoverRect.width - padding
    }

    // Flip vertically if needed
    if (position === 'top' && top < padding) {
      finalPosition = 'bottom'
      top = triggerRect.bottom + gap
    } else if (position === 'bottom' && top + popoverRect.height > viewportHeight - padding) {
      finalPosition = 'top'
      top = triggerRect.top - popoverRect.height - gap
    }

    // Flip horizontally if needed
    if (position === 'left' && left < padding) {
      finalPosition = 'right'
      left = triggerRect.right + gap
    } else if (position === 'right' && left + popoverRect.width > viewportWidth - padding) {
      finalPosition = 'left'
      left = triggerRect.left - popoverRect.width - gap
    }

    setPopoverPosition({ top, left })
    setActualPosition(finalPosition)
  }, [position])

  const handleTriggerClick = (): void => {
    if (trigger === 'click') {
      setIsOpen(!isOpen)
    }
  }

  const handleMouseEnter = (): void => {
    if (trigger === 'hover') {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      setIsOpen(true)
    }
  }

  const handleMouseLeave = (): void => {
    if (trigger === 'hover') {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 100)
    }
  }

  const handlePopoverMouseEnter = (): void => {
    if (trigger === 'hover' && hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handlePopoverMouseLeave = (): void => {
    if (trigger === 'hover') {
      setIsOpen(false)
    }
  }

  // Click outside to close
  useEffect(() => {
    if (!isOpen || trigger !== 'click') return

    const handleClickOutside = (event: MouseEvent): void => {
      if (
        triggerRef.current &&
        popoverRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, trigger, setIsOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, setIsOpen])

  // Calculate position when opened
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      calculatePosition()
    }
  }, [isOpen, calculatePosition])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Clone child and attach refs and handlers
  const triggerProps: Record<string, unknown> = {
    ref: triggerRef
  }

  if (trigger === 'click') {
    triggerProps.onClick = handleTriggerClick
  } else {
    triggerProps.onMouseEnter = handleMouseEnter
    triggerProps.onMouseLeave = handleMouseLeave
  }

  const triggerElement = React.cloneElement(children, triggerProps)

  const popoverClasses = [
    'popover',
    `popover--${actualPosition}`,
    isOpen && 'popover--open',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {triggerElement}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={popoverClasses}
            role="dialog"
            aria-modal="false"
            style={{
              position: 'fixed',
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`
            }}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <div className="popover__content">{content}</div>
          </div>,
          document.body
        )}
    </>
  )
}
