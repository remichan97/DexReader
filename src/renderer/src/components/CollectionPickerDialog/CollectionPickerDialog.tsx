import { useState, useEffect } from 'react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useCollectionsStore } from '@renderer/stores'
import './CollectionPickerDialog.css'
import { rendererLog } from '@renderer/services/logging.service'

export interface CollectionPickerDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean

  /**
   * Called when the dialog should close
   */
  onClose: () => void

  /**
   * Manga ID to add to collection(s)
   */
  mangaId: string

  /**
   * Called when "Create New Collection" is clicked
   */
  onCreateNew: () => void

  /**
   * Optional callback to reload collection data after successful save
   */
  onSaveComplete?: () => void | Promise<void>
}

/**
 * Dialog for selecting which collections to add manga to
 *
 * @example
 * ```tsx
 * <CollectionPickerDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   mangaId="manga-123"
 *   onCreateNew={handleCreateNew}
 * />
 * ```
 */
export function CollectionPickerDialog({
  isOpen,
  onClose,
  mangaId,
  onCreateNew,
  onSaveComplete
}: Readonly<CollectionPickerDialogProps>): React.JSX.Element {
  const { t } = useTranslation('dialogs')
  const { collections, loadCollections, addToCollection, removeFromCollection } =
    useCollectionsStore()
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load collections when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen, loadCollections])

  // Load which collections the manga is already in
  useEffect(() => {
    const loadMangaCollections = async (): Promise<void> => {
      if (isOpen && mangaId) {
        const result = await globalThis.collections.getCollectionsByManga(mangaId)
        if (result.success && result.data) {
          setSelectedCollections(new Set(result.data.map((c) => c.id)))
        }
      }
    }

    void loadMangaCollections()
  }, [isOpen, mangaId])

  const handleToggleCollection = (collectionId: number): void => {
    setSelectedCollections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  const handleSave = async (): Promise<void> => {
    setIsSubmitting(true)

    try {
      // Add to selected collections
      await Promise.all(
        Array.from(selectedCollections).map((collectionId) =>
          addToCollection({ collectionId, mangaId })
        )
      )

      // Remove from unselected collections (batch operation)
      const collectionsToRemove = collections
        .filter((c) => !selectedCollections.has(c.id))
        .map((c) => ({ collectionId: c.id, mangaId }))

      if (collectionsToRemove.length > 0) {
        await removeFromCollection(collectionsToRemove)
      }

      // Reload collection data if callback provided
      if (onSaveComplete) {
        await onSaveComplete()
      }

      onClose()
    } catch (error) {
      rendererLog.error('[CollectionPickerDialog] Error updating collections:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (): void => {
    if (!isSubmitting) {
      setSelectedCollections(new Set())
      onClose()
    }
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title={t('collectionPicker.title')} size="small">
      <div className="collection-picker-dialog flex flex-col gap-4">
        {collections.length === 0 ? (
          <div className="collection-picker-dialog__empty flex flex-col items-center gap-3">
            <p>{t('collectionPicker.emptyState.message')}</p>
            <Button variant="primary" onClick={onCreateNew}>
              {t('collectionPicker.emptyState.button')}
            </Button>
          </div>
        ) : (
          <>
            <div className="collection-picker-dialog__list flex flex-col gap-2">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="collection-picker-dialog__item flex flex-col gap-1"
                >
                  <Checkbox
                    checked={selectedCollections.has(collection.id)}
                    onChange={() => handleToggleCollection(collection.id)}
                    label={collection.name}
                  />
                  {collection.description && (
                    <p className="collection-picker-dialog__description">
                      {collection.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="collection-picker-dialog__create-new flex items-center justify-center"
              onClick={onCreateNew}
            >
              {t('collectionPicker.createNewButton')}
            </button>

            <div className="collection-picker-dialog__actions flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('collectionPicker.buttons.cancel')}
              </Button>
              <Button type="button" variant="primary" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting
                  ? t('collectionPicker.buttons.saving')
                  : t('collectionPicker.buttons.save')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
