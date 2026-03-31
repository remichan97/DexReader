import type { JSX } from 'react'
import { useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'

interface EditCollectionModalProps {
  readonly collection: {
    readonly id: number
    readonly name: string
    readonly description?: string
  } | null
  readonly isSubmitting: boolean
  readonly onUpdate: (name: string, description: string) => Promise<void>
  readonly onClose: () => void
}

export function EditCollectionModal({
  collection,
  isSubmitting,
  onUpdate,
  onClose
}: EditCollectionModalProps): JSX.Element | null {
  const [editName, setEditName] = useState(collection?.name || '')
  const [editDescription, setEditDescription] = useState(collection?.description || '')

  // Update local state when collection prop changes
  if (collection && collection.name !== editName && !isSubmitting) {
    setEditName(collection.name)
    setEditDescription(collection.description || '')
  }

  const handleUpdate = async (): Promise<void> => {
    if (!collection || !editName.trim()) return
    await onUpdate(editName, editDescription)
  }

  const handleClose = (): void => {
    setEditName('')
    setEditDescription('')
    onClose()
  }

  if (!collection) return null

  return (
    <Modal
      open={true}
      onClose={handleClose}
      title="Edit Collection"
      size="small"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={isSubmitting || !editName.trim()}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Collection Name"
          value={editName}
          onChange={setEditName}
          placeholder="e.g., Reading, Want to Read"
          disabled={isSubmitting}
          autoFocus
          required
        />
        <Input
          label="Description (Optional)"
          value={editDescription}
          onChange={setEditDescription}
          placeholder="Add a description"
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  )
}
