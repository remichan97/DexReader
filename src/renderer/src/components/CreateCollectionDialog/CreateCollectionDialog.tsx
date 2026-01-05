import { useState } from 'react'
import { Popover } from '../Popover'
import { Input } from '../Input'
import { Button } from '../Button'
import './CreateCollectionDialog.css'

export interface CreateCollectionDialogProps {
  /**
   * Called when collection is created or updated
   */
  onCreate: (name: string, description?: string) => Promise<void>

  /**
   * Called when dialog is closed without creating/updating
   */
  onClose?: () => void

  /**
   * Optional manga ID to auto-add after creation
   */
  autoAddMangaId?: string

  /**
   * Trigger element (button)
   */
  trigger: React.ReactElement

  /**
   * Initial values for edit mode
   */
  initialValues?: {
    name: string
    description?: string
  }

  /**
   * Dialog title (defaults to "Create Collection" or "Edit Collection")
   */
  title?: string

  /**
   * Controlled open state
   */
  open?: boolean

  /**
   * Called when open state should change
   */
  onOpenChange?: (open: boolean) => void
}

/**
 * Popover for creating or editing a collection
 *
 * @example
 * ```tsx
 * <CreateCollectionDialog
 *   onCreate={handleCreate}
 *   trigger={<Button>+ Collection</Button>}
 * />
 * ```
 */
export function CreateCollectionDialog({
  onCreate,
  onClose,
  autoAddMangaId,
  trigger,
  initialValues,
  title,
  open: controlledOpen,
  onOpenChange
}: Readonly<CreateCollectionDialogProps>): React.JSX.Element {
  const isEditMode = !!initialValues
  const defaultTitle = isEditMode ? 'Edit Collection' : 'Create Collection'
  const [name, setName] = useState(initialValues?.name || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled open if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

  const updateOpen = (open: boolean): void => {
    if (controlledOpen === undefined) {
      setInternalOpen(open)
    }
    onOpenChange?.(open)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

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
      updateOpen(false)
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
      updateOpen(false)
      onClose?.()
    }
  }

  const popoverContent = (
    <form onSubmit={handleSubmit} className="create-collection-dialog">
      <div className="create-collection-dialog__header">
        <h3 className="create-collection-dialog__title">{title || defaultTitle}</h3>
      </div>

      <div className="create-collection-dialog__content">
        {autoAddMangaId && (
          <p className="create-collection-dialog__hint">
            This manga will be added to the new collection
          </p>
        )}

        <Input
          label="Collection Name"
          value={name}
          onChange={setName}
          placeholder="e.g., Reading, Want to Read"
          error={error || undefined}
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

      <div className="create-collection-dialog__actions">
        <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting || !name.trim()}>
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update'
              : 'Create'}
        </Button>
      </div>
    </form>
  )

  return (
    <Popover open={isOpen} onOpenChange={updateOpen} position="bottom" content={popoverContent}>
      {trigger}
    </Popover>
  )
}
