import { useState } from 'react'
import { Modal } from '../Modal'
import { Input } from '../Input'
import { Button } from '../Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  const { t } = useTranslation(['dialogs', 'common'])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      setError(t('dialogs:createCollection.fields.name.error'))
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
      setError(
        err instanceof Error ? err.message : t('dialogs:createCollection.errors.createFailed')
      )
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
      title={t('dialogs:createCollection.title')}
      size="small"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('common:button.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? t('common:button.creating') : t('common:button.create')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="text-error text-sm">{error}</div>}
        <Input
          label={t('dialogs:createCollection.fields.name.label')}
          value={name}
          onChange={setName}
          placeholder={t('common:form.placeholder.collectionName')}
          disabled={isSubmitting}
          autoFocus
          required
        />
        <Input
          label={t('dialogs:createCollection.fields.description.label')}
          value={description}
          onChange={setDescription}
          placeholder={t('common:form.placeholder.description')}
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  )
}
