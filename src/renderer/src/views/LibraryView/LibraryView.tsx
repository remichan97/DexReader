import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { MangaCard } from '@renderer/components/MangaCard'
import { SearchBar } from '@renderer/components/SearchBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { Modal } from '@renderer/components/Modal'
import { Input } from '@renderer/components/Input'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { CreateCollectionDialog } from '@renderer/components/CreateCollectionDialog'
import { CollectionPickerDialog } from '@renderer/components/CollectionPickerDialog'
import { ContextMenu } from '@renderer/components/ContextMenu'
import { ImportProgressDialog } from '@renderer/components/ImportProgressDialog'
import { ImportResultDialog } from '@renderer/components/ImportResultDialog'
import { DexReaderExportDialog, type ExportOptions } from '@renderer/components/DexReaderExportDialog'
import { useLibraryStore, useCollectionsStore, useToastStore } from '@renderer/stores'

// ImportResult interface matches src/main/services/results/import.result.ts
interface ImportResult {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: Array<{
    mangaId?: string
    title?: string
    reason: string
  }>
  importedMangaIds?: string[]
}
import {
  BookOpen48Regular,
  Search48Regular,
  Warning48Regular,
  ArrowClockwise24Regular,
  Add24Regular,
  Edit20Regular,
  Delete20Regular
} from '@fluentui/react-icons'
import './LibraryView.css'

// Helper Components (moved outside parent to prevent re-renders)
interface EmptyStateProps {
  readonly message: string
  readonly isSearchResult?: boolean
}

const EmptyState = ({ message, isSearchResult = false }: EmptyStateProps): JSX.Element => (
  <div className="library__empty">
    {isSearchResult ? (
      <Search48Regular style={{ opacity: 0.3, marginBottom: '12px' }} />
    ) : (
      <BookOpen48Regular style={{ opacity: 0.3, marginBottom: '12px' }} />
    )}
    <div>{message}</div>
  </div>
)

interface MangaGridProps {
  readonly items: Array<{
    readonly mangaId: string
    readonly coverUrl?: string
    readonly title: string
    readonly authors: string[]
    readonly status: string
    readonly lastChapter?: string
    readonly hasNewChapters?: boolean
  }>
  readonly onFavourite?: (id: string) => void
  readonly onClick?: (id: string) => void
  readonly onAddToCollection?: (id: string) => void
}

const MangaGrid = ({
  items,
  onFavourite,
  onClick,
  onAddToCollection
}: MangaGridProps): JSX.Element => (
  <div className="library__grid">
    {items.map((manga) => (
      <ContextMenu
        key={manga.mangaId}
        trigger={
          <div>
            <MangaCard
              id={manga.mangaId}
              coverUrl={manga.coverUrl || ''}
              title={manga.title}
              author={manga.authors[0] || 'Unknown'}
              status={manga.status as 'ongoing' | 'completed' | 'hiatus'}
              isFavourite={true}
              showFavouriteBadge={false}
              hasNewChapters={manga.hasNewChapters}
              onFavourite={onFavourite}
              onClick={onClick}
            />
          </div>
        }
        items={[
          {
            label: 'Go to Detail',
            onClick: () => onClick?.(manga.mangaId)
          },
          { type: 'separator' },
          {
            label: 'Add to Collection...',
            onClick: () => onAddToCollection?.(manga.mangaId)
          },
          { type: 'separator' },
          {
            label: 'Remove from Library',
            onClick: () => onFavourite?.(manga.mangaId)
          }
        ]}
      />
    ))}
  </div>
)

export function LibraryView(): JSX.Element {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [pickerDialogOpen, setPickerDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedMangaForCollection, setSelectedMangaForCollection] = useState<string | null>(null)
  const [editingCollection, setEditingCollection] = useState<{
    id: number
    name: string
    description?: string
  } | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [contextMenuCollection, setContextMenuCollection] = useState<{
    id: number
    name: string
  } | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  // Track manga IDs for each collection
  const [collectionMangaMap, setCollectionMangaMap] = useState<Record<number, string[]>>({})

  // Import state
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const importingRef = useRef(false) // Synchronous guard against double imports

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFilePath, setExportFilePath] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Stores
  const { favourites, loading, error, loadFavourites, toggleFavourite } = useLibraryStore()
  const { collections, loadCollections, createCollection, updateCollection, deleteCollection } =
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

  // Load favourites and collections on mount
  useEffect(() => {
    loadFavourites()
    loadCollections()
  }, [loadFavourites, loadCollections])

  // Load manga IDs for all collections when collections change
  useEffect(() => {
    if (collections.length > 0) {
      void loadCollectionManga()
    } else {
      setCollectionMangaMap({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections])

  // Listen for import events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onImportTachiyomi(async (filePath: string) => {
      // Prevent concurrent imports with synchronous ref check
      if (importingRef.current) {
        console.warn('Import already in progress, ignoring duplicate request')
        return
      }

      // Start import
      importingRef.current = true
      setIsImporting(true)
      setImportResult(null)

      try {
        const response = await globalThis.mihon.importBackup(filePath)

        if (response.success && response.data) {
          setImportResult(response.data)

          // Reload library to show imported manga
          await loadFavourites()
          await loadCollections()

          // Show toast notification
          show({
            title: 'Import Complete',
            message: `Imported ${response.data.importedMangaCount} manga, skipped ${response.data.skippedMangaCount}, failed ${response.data.failedMangaCount}`,
            variant: response.data.failedMangaCount > 0 ? 'warning' : 'success',
            duration: 4000
          })
        } else {
          // Import failed
          show({
            title: 'Import Failed',
            message: response.error || 'Could not import backup file',
            variant: 'error',
            duration: 4000
          })
        }
      } catch (error) {
        console.error('Error importing backup:', error)
        show({
          title: 'Import Failed',
          message: 'An error occurred during import',
          variant: 'error',
          duration: 4000
        })
      } finally {
        importingRef.current = false
        setIsImporting(false)
      }
    })

    return removeListener
  }, [show, loadFavourites, loadCollections])

  // Listen for export events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onExportTachiyomi(async (filePath: string) => {
      try {
        const response = await globalThis.mihon.exportBackup(filePath)

        if (response.success && response.data) {
          show({
            title: 'Export Complete',
            message: `Exported ${response.data.exportedCount} manga to Mihon backup`,
            variant: 'success',
            duration: 4000
          })
        } else {
          show({
            title: 'Export Failed',
            message: response.error || 'Could not export library',
            variant: 'error',
            duration: 4000
          })
        }
      } catch (error) {
        console.error('Error exporting backup:', error)
        show({
          title: 'Export Failed',
          message: 'An error occurred during export',
          variant: 'error',
          duration: 4000
        })
      }
    })

    return removeListener
  }, [show])

  // Listen for DexReader export events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onExportLibrary((filePath: string) => {
      setExportFilePath(filePath)
      setExportDialogOpen(true)
    })

    return removeListener
  }, [])

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
  }

  const handleMangaClick = (id: string): void => {
    navigate(`/browse/${id}`)
  }

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

  const handleEditCollection = (collection: {
    id: number
    name: string
    description?: string
  }): void => {
    setEditingCollection(collection)
    setEditName(collection.name)
    setEditDescription(collection.description || '')
  }

  const handleUpdateCollection = async (): Promise<void> => {
    if (!editingCollection || !editName.trim()) return

    setIsSubmittingEdit(true)
    try {
      await updateCollection({
        id: editingCollection.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined
      })

      show({
        title: 'Collection Updated',
        message: `"${editName}" has been updated`,
        variant: 'success',
        duration: 3000
      })

      setEditingCollection(null)
      setEditName('')
      setEditDescription('')
    } catch (error) {
      console.error('Error updating collection:', error)
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
    if (result.success && !result.data) return

    try {
      await deleteCollection(collectionId)

      show({
        title: 'Collection Deleted',
        message: `"${collectionName}" has been removed`,
        variant: 'success',
        duration: 3000
      })
    } catch (error) {
      console.error('Error deleting collection:', error)
      show({
        title: 'Delete Failed',
        message: 'Could not delete collection',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleCheckUpdates = async (): Promise<void> => {
    if (favourites.length === 0) {
      show({
        title: 'No manga in library',
        message: 'Add some manga to your library first',
        variant: 'info',
        duration: 3000
      })
      return
    }

    show({
      title: 'Checking for updates...',
      message: `Checking ${favourites.length} manga...`,
      variant: 'info',
      duration: 2000
    })

    try {
      const mangaIds = favourites.map((m) => m.mangaId)
      const response = await globalThis.library.checkForUpdates(mangaIds)

      if (response.success && response.data) {
        const updatedCount = response.data.filter((r) => r.hasNewChapters).length

        show({
          title: 'Update check complete',
          message:
            updatedCount > 0
              ? `Found updates for ${updatedCount} manga!`
              : 'Your library is up to date',
          variant: updatedCount > 0 ? 'success' : 'info',
          duration: 3000
        })

        // Reload library to show update indicators
        await loadFavourites()
      } else {
        throw new Error(response.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      show({
        title: 'Update check failed',
        message: 'Could not check for updates. Please try again.',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleExport = async (options: ExportOptions): Promise<void> => {
    if (!exportFilePath) return

    setIsExporting(true)
    try {
      const response = await globalThis.dexreader.exportData(exportFilePath, options)

      if (response.success && response.data) {
        show({
          title: 'Export Complete',
          message: `Exported ${response.data.exportedMangaCount} manga to DexReader backup`,
          variant: 'success',
          duration: 4000
        })

        setExportDialogOpen(false)
        setExportFilePath(null)
      } else {
        show({
          title: 'Export Failed',
          message: response.error || 'Could not export library',
          variant: 'error',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error exporting backup:', error)
      show({
        title: 'Export Failed',
        message: 'An error occurred during export',
        variant: 'error',
        duration: 4000
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCloseExportDialog = (): void => {
    if (!isExporting) {
      setExportDialogOpen(false)
      setExportFilePath(null)
    }
  }

  const handleCancelImport = async (): Promise<void> => {
    try {
      const response = await globalThis.mihon.cancelImport()
      if (response.success) {
        show({
          title: 'Import Cancelled',
          message: 'The import has been cancelled',
          variant: 'info',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error cancelling import:', error)
    }
  }

  const handleRemoveFromLibrary = async (id: string): Promise<void> => {
    const manga = favourites.find((m) => m.mangaId === id)

    try {
      const newStatus = await toggleFavourite(id)

      // Show toast notification
      show({
        title: newStatus ? 'Added to Library!' : 'Removed from Library!',
        message: manga ? manga.title : 'Manga updated',
        variant: 'info',
        duration: 3000
      })
    } catch (error) {
      console.error('Error toggling favourite:', error)
      show({
        title: 'Error',
        message: 'Failed to update library',
        variant: 'error',
        duration: 3000
      })
    }
  }

  interface MangaItem {
    mangaId: string
    coverUrl?: string
    title: string
    authors: string[]
    status: string
    lastChapter?: string
  }

  const filterManga = (manga: MangaItem[]): MangaItem[] => {
    if (!searchQuery) return manga
    return manga.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const filteredAll = filterManga(favourites)
  const hasCollections = collections.length > 0

  return (
    <div style={{ padding: '24px' }}>
      {/* Search Bar with Actions */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search your library"
          />
        </div>
        <CreateCollectionDialog
          onCreate={handleCreateCollection}
          onClose={() => setSelectedMangaForCollection(null)}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          autoAddMangaId={selectedMangaForCollection || undefined}
          trigger={
            <Button
              variant="secondary"
              size="medium"
              icon={<Add24Regular />}
              aria-label="Create collection"
              title="Create a new collection"
              style={{ height: '35px' }}
            >
              Collection
            </Button>
          }
        />
        <Button
          variant="primary"
          size="medium"
          icon={<ArrowClockwise24Regular />}
          onClick={handleCheckUpdates}
          aria-label="Check for updates"
          title="Check for updates (Ctrl+Shift+U)"
          style={{ height: '35px' }}
        />
      </div>

      {/* Edit Collection Modal */}
      {editingCollection && (
        <Modal
          open={!!editingCollection}
          onClose={() => {
            setEditingCollection(null)
            setEditName('')
            setEditDescription('')
          }}
          title="Edit Collection"
          size="small"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingCollection(null)
                  setEditName('')
                  setEditDescription('')
                }}
                disabled={isSubmittingEdit}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateCollection}
                disabled={isSubmittingEdit || !editName.trim()}
              >
                {isSubmittingEdit ? 'Updating...' : 'Update'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Collection Name"
              value={editName}
              onChange={setEditName}
              placeholder="e.g., Reading, Want to Read"
              disabled={isSubmittingEdit}
              autoFocus
              required
            />
            <Input
              label="Description (Optional)"
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Add a description"
              disabled={isSubmittingEdit}
            />
          </div>
        </Modal>
      )}

      {/* Loading State */}
      {loading && <SkeletonGrid count={12} />}

      {/* Error State */}
      {error && !loading && (
        <div className="library__empty">
          <Warning48Regular style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Content - Only show if not loading and no error */}
      {!loading && !error && (
        <>
          {/* Collection Tabs - only shown when user has collections */}
          {hasCollections ? (
            <Tabs defaultValue="all">
              <TabList>
                <Tab value="all">
                  All{' '}
                  <Badge variant="default" size="small">
                    {favourites.length}
                  </Badge>
                </Tab>
                {collections.map((collection) => (
                  <Tab
                    key={collection.id}
                    value={String(collection.id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenuCollection(collection)
                      setContextMenuPosition({ top: e.clientY, left: e.clientX })
                    }}
                  >
                    {collection.name}{' '}
                    <Badge variant="default" size="small">
                      {collectionMangaMap[collection.id]?.length || 0}
                    </Badge>
                  </Tab>
                ))}
              </TabList>

              {/* Context Menu Portal */}
              {contextMenuCollection && contextMenuPosition && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 9998
                    }}
                    onClick={() => {
                      setContextMenuCollection(null)
                      setContextMenuPosition(null)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setContextMenuCollection(null)
                      setContextMenuPosition(null)
                    }}
                  />
                  {/* Menu */}
                  <div
                    className="context-menu__dropdown"
                    style={{
                      position: 'fixed',
                      top: `${contextMenuPosition.top}px`,
                      left: `${contextMenuPosition.left}px`,
                      zIndex: 9999
                    }}
                  >
                    <div className="context-menu__list">
                      <button
                        type="button"
                        className="context-menu__item"
                        onClick={() => {
                          handleEditCollection(contextMenuCollection)
                          setContextMenuCollection(null)
                          setContextMenuPosition(null)
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
                          void handleDeleteCollection(
                            contextMenuCollection.id,
                            contextMenuCollection.name
                          )
                          setContextMenuCollection(null)
                          setContextMenuPosition(null)
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
              )}

              <TabPanel value="all">
                {filteredAll.length === 0 ? (
                  <EmptyState
                    message={
                      searchQuery
                        ? "Can't find what you're looking for..."
                        : 'Nothing here yet! Start adding some manga from Browse.'
                    }
                    isSearchResult={!!searchQuery}
                  />
                ) : (
                  <MangaGrid
                    items={filteredAll}
                    onFavourite={handleRemoveFromLibrary}
                    onClick={handleMangaClick}
                    onAddToCollection={handleAddToCollection}
                  />
                )}
              </TabPanel>

              {collections.map((collection) => {
                // Get manga IDs that belong to this collection
                const collectionMangaIds = collectionMangaMap[collection.id] || []
                // Filter favourites to only show manga in this collection
                const collectionManga = filterManga(
                  favourites.filter((manga) => collectionMangaIds.includes(manga.mangaId))
                )
                return (
                  <TabPanel key={collection.id} value={String(collection.id)}>
                    {collectionManga.length === 0 ? (
                      <EmptyState
                        message={
                          searchQuery
                            ? `Nothing in "${collection.name}" matches that...`
                            : `Your "${collection.name}" collection is empty!`
                        }
                        isSearchResult={!!searchQuery}
                      />
                    ) : (
                      <MangaGrid
                        items={collectionManga}
                        onFavourite={handleRemoveFromLibrary}
                        onClick={handleMangaClick}
                        onAddToCollection={handleAddToCollection}
                      />
                    )}
                  </TabPanel>
                )
              })}
            </Tabs>
          ) : (
            // No collections - show all manga in a simple grid
            <>
              {filteredAll.length === 0 ? (
                <EmptyState
                  message={
                    searchQuery
                      ? "Can't find what you're looking for..."
                      : 'Nothing here yet! Start adding some manga from Browse.'
                  }
                  isSearchResult={!!searchQuery}
                />
              ) : (
                <MangaGrid
                  items={filteredAll}
                  onFavourite={handleRemoveFromLibrary}
                  onClick={handleMangaClick}
                  onAddToCollection={handleAddToCollection}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Collection Picker Dialog */}
      {selectedMangaForCollection && (
        <CollectionPickerDialog
          isOpen={pickerDialogOpen}
          onClose={() => {
            setPickerDialogOpen(false)
            setSelectedMangaForCollection(null)
            // Refresh collection manga after adding
            void loadCollectionManga()
          }}
          mangaId={selectedMangaForCollection}
          onCreateNew={() => {
            setPickerDialogOpen(false)
            // Automatically open the Create Collection dialog
            setCreateDialogOpen(true)
          }}
        />
      )}

      {/* Import Progress Dialog */}
      <ImportProgressDialog
        open={isImporting}
        current={0}
        total={0}
        onCancel={handleCancelImport}
      />

      {/* Import Result Dialog */}
      {importResult && (
        <ImportResultDialog
          open={!!importResult}
          result={importResult}
          onClose={() => setImportResult(null)}
          onViewLibrary={() => {
            setImportResult(null)
            // Already in library, just scroll to top
            globalThis.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {/* DexReader Export Dialog */}
      <DexReaderExportDialog
        isOpen={exportDialogOpen}
        onClose={handleCloseExportDialog}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  )
}
