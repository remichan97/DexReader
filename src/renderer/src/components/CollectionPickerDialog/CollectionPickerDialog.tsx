import { useState, useEffect } from 'react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { useCollectionsStore } from '@renderer/stores'
import './CollectionPickerDialog.css'

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
  onCreateNew
}: Readonly<CollectionPickerDialogProps>): React.JSX.Element {
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
      const addPromises = Array.from(selectedCollections).map((collectionId) =>
        addToCollection({ collectionId, mangaId })
      )

      // Remove from unselected collections (batch operation)
      const collectionsToRemove = collections
        .filter((c) => !selectedCollections.has(c.id))
        .map((c) => ({ collectionId: c.id, mangaId }))

      const removePromise =
        collectionsToRemove.length > 0
          ? removeFromCollection(collectionsToRemove)
          : Promise.resolve()

      await Promise.all([...addPromises, removePromise])

      onClose()
    } catch (error) {
      console.error('Error updating collections:', error)
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
    <Modal open={isOpen} onClose={handleClose} title="Manage Collections" size="small">
      <div className="collection-picker-dialog">
        {collections.length === 0 ? (
          <div className="collection-picker-dialog__empty">
            <p>You haven&apos;t created any collections yet.</p>
            <Button variant="primary" onClick={onCreateNew}>
              Create Your First Collection
            </Button>
          </div>
        ) : (
          <>
            <div className="collection-picker-dialog__list">
              {collections.map((collection) => (
                <div key={collection.id} className="collection-picker-dialog__item">
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
              className="collection-picker-dialog__create-new"
              onClick={onCreateNew}
            >
              + Create New Collection
            </button>

            <div className="collection-picker-dialog__actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
