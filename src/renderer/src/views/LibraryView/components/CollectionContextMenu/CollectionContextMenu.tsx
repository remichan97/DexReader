import type { JSX } from 'react'
import { Edit20Regular, Delete20Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import '@renderer/components/ContextMenu/ContextMenu.css'

interface CollectionContextMenuProps {
  readonly position: {
    readonly top: number
    readonly left: number
  }
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly onClose: () => void
}

/**
 * Context menu for collection tabs
 *
 * Uses the same structure and styles as the reusable ContextMenu component,
 * but with manual positioning to work with Tab components.
 */
export function CollectionContextMenu({
  position,
  onEdit,
  onDelete,
  onClose
}: CollectionContextMenuProps): JSX.Element {
  const { t } = useTranslation(['common'])

  const menuItems = [
    {
      id: 'edit',
      label: t('common:action.editCollection'),
      icon: <Edit20Regular />,
      onClick: () => {
        onEdit()
        onClose()
      }
    },
    {
      id: 'separator-1',
      type: 'separator' as const
    },
    {
      id: 'delete',
      label: t('common:action.deleteCollection'),
      icon: <Delete20Regular />,
      onClick: () => {
        onDelete()
        onClose()
      }
    }
  ]

  const handleBackdropClick = (): void => {
    onClose()
  }

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998
        }}
        onClick={handleBackdropClick}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      {/* Menu */}
      <div
        className="context-menu__dropdown"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 9999
        }}
      >
        <div className="context-menu__list flex flex-col">
          {menuItems.map((item) => {
            if (item.type === 'separator') {
              return <div key={item.id} className="context-menu__separator" />
            }

            return (
              <button
                key={item.id}
                type="button"
                className="context-menu__item flex items-center gap-2"
                onClick={item.onClick}
              >
                {item.icon && <span className="context-menu__item-icon">{item.icon}</span>}
                <span className="context-menu__item-label">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
