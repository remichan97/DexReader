import type { JSX } from 'react'
import { Edit20Regular, Delete20Regular } from '@fluentui/react-icons'

interface CollectionContextMenuProps {
  readonly collection: {
    readonly id: number
    readonly name: string
  }
  readonly position: {
    readonly top: number
    readonly left: number
  }
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly onClose: () => void
}

export function CollectionContextMenu({
  position,
  onEdit,
  onDelete,
  onClose
}: CollectionContextMenuProps): JSX.Element {
  return (
    <>
      {/* Backdrop to close menu */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998
        }}
        onClick={onClose}
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
        <div className="context-menu__list">
          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onEdit()
              onClose()
            }}
          >
            <span className="context-menu__item-icon">
              <Edit20Regular />
            </span>
            <span className="context-menu__item-label">Edit Collection</span>
          </button>
          <div className="context-menu__separator" />
          <button
            type="button"
            className="context-menu__item"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            <span className="context-menu__item-icon">
              <Delete20Regular />
            </span>
            <span className="context-menu__item-label">Delete Collection</span>
          </button>
        </div>
      </div>
    </>
  )
}
