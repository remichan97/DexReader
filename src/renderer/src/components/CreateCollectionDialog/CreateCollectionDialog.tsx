import { useState } from 'react'
import { Modal } from '../Modal'
import { Input } from '../Input'
import { Button } from '../Button'
import './CreateCollectionDialog.css'

export interface CreateCollectionDialogProps {
  /**
   * Called when collection is created
   */
  onCreate: (name: string, description?: string) => Promise<void>

  /**
   * Called when dialog is closed without creating
   */
  onClose?: () => void

  /**
   * Optional manga ID to auto-add after creation
   */
  autoAddMangaId?: string

  /**
   * Controlled open state
   */
  open: boolean

  /**
   * Called when open state should change
   */
  onOpenChange: (open: boolean) => void
}

/**
 * Modal for creating a collection
 *
 * @example
 * ```tsx
 * <CreateCollectionDialog
 *   onCreate={handleCreate}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function CreateCollectionDialog({
  onCreate,
  onClose,
  open,
  onOpenChange
}: Readonly<CreateCollectionDialogProps>): React.JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onCreate(name.trim(), description.trim() || undefined)
      // Reset form and close
      setName('')
      setDescription('')
      setError(null)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (): void => {
    if (!isSubmitting) {
      setName('')
      setDescription('')
      setError(null)
      onOpenChange(false)
      onClose?.()
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Collection"
      size="small"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="text-error text-sm">{error}</div>}
        <Input
          label="Collection Name"
          value={name}
          onChange={setName}
          placeholder="e.g., Reading, Want to Read"
          disabled={isSubmitting}
          autoFocus
          required
        />
        <Input
          label="Description (Optional)"
          value={description}
          onChange={setDescription}
          placeholder="Add a description"
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  )
}
