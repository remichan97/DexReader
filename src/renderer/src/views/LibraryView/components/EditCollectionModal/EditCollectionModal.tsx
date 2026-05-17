import type { JSX } from 'react'
import { useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { useTranslation } from '@renderer/hooks/useTranslation'

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
  const { t } = useTranslation(['common'])
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
      title={t('common:action.editCollection')}
      size="small"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('common:button.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={isSubmitting || !editName.trim()}
          >
            {isSubmitting ? t('common:button.updating') : t('common:action.update')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('common:label.collectionName')}
          value={editName}
          onChange={setEditName}
          placeholder={t('common:form.placeholder.collectionName')}
          disabled={isSubmitting}
          autoFocus
          required
        />
        <Input
          label={t('common:form.descriptionOptional')}
          value={editDescription}
          onChange={setEditDescription}
          placeholder={t('common:form.placeholder.description')}
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  )
}
