import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BaseComponentProps } from '@renderer/types/components'
import './Tooltip.css'

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

export interface TooltipProps extends BaseComponentProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode

  /**
   * Preferred position (will auto-flip if near edge)
   * @default 'top'
   */
  position?: TooltipPosition

  /**
   * Delay before showing tooltip in milliseconds
   * @default 500
   */
  delay?: number

  /**
   * Trigger element
   */
  children: React.ReactElement
}

/**
 * Tooltip component for hover information
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
  children,
  className = ''
}: Readonly<TooltipProps>): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [actualPosition, setActualPosition] = useState(position)
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const calculatePosition = React.useCallback((): void => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const gap = 8 // Gap between trigger and tooltip

    let top = 0
    let left = 0
    let finalPosition = position

    // Calculate initial position
    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - gap
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + gap
        break
    }

    // Auto-flip if near viewport edges
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8

    // Flip vertically if needed
    if ((position === 'top' || position === 'bottom') && left < padding) {
      left = padding
    } else if (
      (position === 'top' || position === 'bottom') &&
      left + tooltipRect.width > viewportWidth - padding
    ) {
      left = viewportWidth - tooltipRect.width - padding
    }

    // Flip horizontally if needed
    if (position === 'top' && top < padding) {
      finalPosition = 'bottom'
      top = triggerRect.bottom + gap
    } else if (position === 'bottom' && top + tooltipRect.height > viewportHeight - padding) {
      finalPosition = 'top'
      top = triggerRect.top - tooltipRect.height - gap
    }

    if (position === 'left' && left < padding) {
      finalPosition = 'right'
      left = triggerRect.right + gap
    } else if (position === 'right' && left + tooltipRect.width > viewportWidth - padding) {
      finalPosition = 'left'
      left = triggerRect.left - tooltipRect.width - gap
    }

    setTooltipPosition({ top, left })
    setActualPosition(finalPosition)
  }, [position])

  const handleMouseEnter = (): void => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      calculatePosition()
    }
  }, [isVisible, calculatePosition])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Clone child and attach refs and handlers
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  } as Record<string, unknown>)

  const tooltipClasses = [
    'tooltip',
    `tooltip--${actualPosition}`,
    isVisible && 'tooltip--visible',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {trigger}
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={tooltipClasses}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`
            }}
          >
            <div className="tooltip__content">{content}</div>
            <div className="tooltip__arrow" />
          </div>,
          document.body
        )}
    </>
  )
}
