import React, { useState, useRef, useEffect } from 'react'
import { BaseComponentProps } from '@renderer/types/components'
import './ContextMenu.css'

export interface ContextMenuItem {
  /**
   * Menu item type
   */
  type?: 'item' | 'separator'

  /**
   * Item label (required for type='item')
   */
  label?: string

  /**
   * Click handler (required for type='item')
   */
  onClick?: () => void

  /**
   * Whether the item is disabled
   */
  disabled?: boolean

  /**
   * Optional icon element
   */
  icon?: React.ReactNode
}

export interface ContextMenuProps extends BaseComponentProps {
  /**
   * Trigger element (button/icon)
   */
  trigger: React.ReactElement

  /**
   * Menu items
   */
  items: ContextMenuItem[]

  /**
   * Alignment of the menu relative to trigger
   * @default 'left'
   */
  align?: 'left' | 'right'
}

/**
 * ContextMenu component with Windows 11 Fluent Design
 *
 * A flat dropdown menu without pointer, similar to Windows 11 context menus.
 * Based on the Select component's dropdown pattern.
 *
 * @example
 * ```tsx
 * <ContextMenu
 *   trigger={<button>⋮</button>}
 *   items={[
 *     { label: 'Edit', onClick: handleEdit },
 *     { type: 'separator' },
 *     { label: 'Delete', onClick: handleDelete }
 *   ]}
 * />
 * ```
 */
export function ContextMenu({
  trigger,
  items,
  align = 'left',
  className = ''
}: Readonly<ContextMenuProps>): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      const actionItems = items.filter((item) => item.type !== 'separator' && !item.disabled)

      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          setFocusedIndex(-1)
          break

        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev + 1
            return next >= actionItems.length ? 0 : next
          })
          break

        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? actionItems.length - 1 : next
          })
          break

        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < actionItems.length) {
            const item = actionItems[focusedIndex]
            if (item.onClick && !item.disabled) {
              item.onClick()
              setIsOpen(false)
            }
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, items])

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
    setFocusedIndex(-1)
    // Position menu at cursor
    setMenuPosition({ top: e.clientY, left: e.clientX })
  }

  const handleItemClick = (item: ContextMenuItem): void => {
    if (item.disabled || !item.onClick) return
    item.onClick()
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  // Clone trigger element and add onContextMenu handler only (not onClick)
  const triggerElement = (
    <div className="context-menu__trigger-wrapper" onContextMenu={handleContextMenu}>
      {trigger}
    </div>
  )

  const containerClasses = [
    'context-menu',
    isOpen && 'context-menu--open',
    `context-menu--align-${align}`,
    className
  ]
    .filter(Boolean)
    .join(' ')

  // Build menu items with focus tracking
  let actionItemIndex = -1

  return (
    <div ref={containerRef} className={containerClasses}>
      {triggerElement}

      {isOpen && (
        <div
          ref={menuRef}
          className="context-menu__dropdown"
          style={
            menuPosition
              ? {
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`
                }
              : undefined
          }
        >
          <div className="context-menu__list">
            {items.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <div
                    key={`sep-${item.label || ''}-${index}`}
                    className="context-menu__separator"
                  />
                )
              }

              actionItemIndex++
              const isFocused = actionItemIndex === focusedIndex

              const itemClasses = [
                'context-menu__item',
                item.disabled && 'context-menu__item--disabled',
                isFocused && 'context-menu__item--focused'
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={`item-${item.label || ''}-${index}`}
                  type="button"
                  className={itemClasses}
                  onClick={() => handleItemClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleItemClick(item)
                    }
                  }}
                  disabled={item.disabled}
                  aria-label={item.label}
                >
                  {item.icon && <span className="context-menu__item-icon">{item.icon}</span>}
                  <span className="context-menu__item-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
