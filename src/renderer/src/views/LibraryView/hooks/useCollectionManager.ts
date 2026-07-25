import { useState, useEffect } from 'react'
import { useCollectionsStore, useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

interface Collection {
  id: number
  name: string
  description?: string
}

interface UseCollectionManagerReturn {
  // State
  editingCollection: Collection | null
  isSubmittingEdit: boolean
  contextMenuCollection: { id: number; name: string } | null
  contextMenuPosition: { top: number; left: number } | null
  collectionMangaMap: Record<number, string[]>
  selectedMangaForCollection: string | null
  pickerDialogOpen: boolean
  createDialogOpen: boolean

  // Setters
  setEditingCollection: (collection: Collection | null) => void
  setContextMenuCollection: (collection: { id: number; name: string } | null) => void
  setContextMenuPosition: (position: { top: number; left: number } | null) => void
  setSelectedMangaForCollection: (mangaId: string | null) => void
  setPickerDialogOpen: (open: boolean) => void
  setCreateDialogOpen: (open: boolean) => void

  // Handlers
  handleEditCollection: (collection: Collection) => void
  handleUpdateCollection: (name: string, description: string) => Promise<void>
  handleDeleteCollection: (collectionId: number, collectionName: string) => Promise<void>
  handleCreateCollection: (name: string, description?: string) => Promise<void>
  handleAddToCollection: (mangaId: string) => void

  // Reload
  reloadCollectionManga: () => Promise<void>
}

export function useCollectionManager(): UseCollectionManagerReturn {
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [contextMenuCollection, setContextMenuCollection] = useState<{
    id: number
    name: string
  } | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const [collectionMangaMap, setCollectionMangaMap] = useState<Record<number, string[]>>({})
  const [selectedMangaForCollection, setSelectedMangaForCollection] = useState<string | null>(null)
  const [pickerDialogOpen, setPickerDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { collections, createCollection, updateCollection, deleteCollection } =
    useCollectionsStore()
  const show = useToastStore((state) => state.show)

  // Load manga IDs for all collections
  const loadCollectionManga = async (): Promise<void> => {
    const mangaMap: Record<number, string[]> = {}
    for (const collection of collections) {
      const result = await globalThis.collections.getMangaInCollection(collection.id)
      if (result.success && result.data) {
        mangaMap[collection.id] = result.data
      } else {
        mangaMap[collection.id] = []
      }
    }
    setCollectionMangaMap(mangaMap)
  }

  // Load manga IDs for all collections when collections change
  useEffect(() => {
    if (collections.length > 0) {
      void loadCollectionManga()
    } else {
      setCollectionMangaMap({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections])

  const handleAddToCollection = (mangaId: string): void => {
    setSelectedMangaForCollection(mangaId)
    if (collections.length === 0) {
      // No collections - automatically open create dialog
      setCreateDialogOpen(true)
    } else {
      // Has collections - show picker
      setPickerDialogOpen(true)
    }
  }

  const handleCreateCollection = async (name: string, description?: string): Promise<void> => {
    const newCollection = await createCollection({ name, description })

    if (newCollection) {
      show({
        title: 'Collection Created',
        message: `"${name}" has been created`,
        variant: 'success',
        duration: 3000
      })

      // If we have a manga waiting to be added, show the picker
      if (selectedMangaForCollection) {
        setPickerDialogOpen(true)
      } else {
        // Clear the selectedMangaForCollection if no manga is waiting
        setSelectedMangaForCollection(null)
      }
    } else {
      // Failed to create collection, clear the selected manga
      setSelectedMangaForCollection(null)
    }
  }

  const handleEditCollection = (collection: Collection): void => {
    setEditingCollection(collection)
  }

  const handleUpdateCollection = async (name: string, description: string): Promise<void> => {
    if (!editingCollection || !name.trim()) return

    setIsSubmittingEdit(true)
    try {
      await updateCollection({
        id: editingCollection.id,
        name: name.trim(),
        description: description.trim() || undefined
      })

      show({
        title: 'Collection Updated',
        message: `"${name}" has been updated`,
        variant: 'success',
        duration: 3000
      })

      setEditingCollection(null)
    } catch (error) {
      rendererLog.error('[useCollectionManager] Error updating collection:', error)
      show({
        title: 'Update Failed',
        message: 'Could not update collection',
        variant: 'error',
        duration: 3000
      })
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteCollection = async (
    collectionId: number,
    collectionName: string
  ): Promise<void> => {
    // Use Electron's native dialog
    const result = await globalThis.api.showConfirmDialog(
      `Delete "${collectionName}"?`,
      'This will not delete the manga, only the collection.',
      'Delete',
      'Cancel'
    )

    // Check if user confirmed (result should be wrapped in IpcResponse)
    if (!result.success || !result.data) return

    try {
      await deleteCollection(collectionId)

      show({
        title: 'Collection Deleted',
        message: `"${collectionName}" has been removed`,
        variant: 'success',
        duration: 3000
      })
    } catch (error) {
      rendererLog.error('[useCollectionManager] Error deleting collection:', error)
      show({
        title: 'Delete Failed',
        message: 'Could not delete collection',
        variant: 'error',
        duration: 3000
      })
    }
  }

  return {
    // State
    editingCollection,
    isSubmittingEdit,
    contextMenuCollection,
    contextMenuPosition,
    collectionMangaMap,
    selectedMangaForCollection,
    pickerDialogOpen,
    createDialogOpen,

    // Setters
    setEditingCollection,
    setContextMenuCollection,
    setContextMenuPosition,
    setSelectedMangaForCollection,
    setPickerDialogOpen,
    setCreateDialogOpen,

    // Handlers
    handleEditCollection,
    handleUpdateCollection,
    handleDeleteCollection,
    handleCreateCollection,
    handleAddToCollection,

    // Reload
    reloadCollectionManga: loadCollectionManga
  }
}
