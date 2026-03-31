import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { SearchBar } from '@renderer/components/SearchBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { LoadingState } from '@renderer/components/LoadingState'
import { EmptyState } from '@renderer/components/EmptyState'
import { CreateCollectionDialog } from '@renderer/components/CreateCollectionDialog'
import { CollectionPickerDialog } from '@renderer/components/CollectionPickerDialog'
import { ImportProgressDialog } from '@renderer/components/ImportProgressDialog'
import { ImportResultDialog } from '@renderer/components/ImportResultDialog'
import { DexReaderExportDialog } from '@renderer/components/DexReaderExportDialog'
import { DexReaderImportDialog } from '@renderer/components/DexReaderImportDialog'
import { useLibraryStore, useCollectionsStore, useToastStore } from '@renderer/stores'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import {
  BookOpen48Regular,
  Search48Regular,
  Warning48Regular,
  ArrowClockwise24Regular,
  Add24Regular
} from '@fluentui/react-icons'
import { MangaGrid } from './components/MangaGrid'
import { CollectionContextMenu } from './components/CollectionContextMenu'
import { EditCollectionModal } from './components/EditCollectionModal'
import { useLibraryFilters } from './hooks/useLibraryFilters'
import { useCollectionManager } from './hooks/useCollectionManager'
import { useMihonImportExport } from './hooks/useMihonImportExport'
import { useDexReaderImportExport } from './hooks/useDexReaderImportExport'
import './LibraryView.css'

export function LibraryView(): JSX.Element {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Stores
  const { favourites, loading, error, loadFavourites } = useLibraryStore()
  const { collections, loadCollections } = useCollectionsStore()
  const show = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Use custom hooks
  const { filterManga } = useLibraryFilters(searchQuery)

  const {
    editingCollection,
    isSubmittingEdit,
    contextMenuCollection,
    contextMenuPosition,
    collectionMangaMap,
    selectedMangaForCollection,
    pickerDialogOpen,
    createDialogOpen,
    setEditingCollection,
    setContextMenuCollection,
    setContextMenuPosition,
    setSelectedMangaForCollection,
    setPickerDialogOpen,
    setCreateDialogOpen,
    handleEditCollection,
    handleUpdateCollection,
    handleDeleteCollection,
    handleCreateCollection,
    handleAddToCollection
  } = useCollectionManager()

  const { isImporting, importResult, clearImportResult, handleCancelImport } = useMihonImportExport(
    loadFavourites,
    loadCollections
  )

  const {
    exportDialogOpen,
    exportFilePath,
    isExporting,
    exportError,
    importDialogOpen,
    importFilePath,
    handleExport,
    handleCloseExportDialog,
    handleImportComplete,
    handleCloseImportDialog
  } = useDexReaderImportExport(loadFavourites, loadCollections)

  // Load favourites and collections on mount
  useEffect(() => {
    loadFavourites()
    loadCollections()
  }, [loadFavourites, loadCollections])

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
  }

  const handleMangaClick = (id: string): void => {
    navigate(`/browse/${id}`)
  }

  const handleCheckUpdates = async (): Promise<void> => {
    if (!isOnline) {
      show({
        title: "You're offline",
        message: 'Check for updates requires an internet connection',
        variant: 'warning',
        duration: 3000
      })
      return
    }

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
        throw new Error(response.error?.message || 'Unknown error')
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

  const handleRemoveFromLibrary = async (id: string): Promise<void> => {
    const manga = favourites.find((m) => m.mangaId === id)

    if (!manga) {
      show({
        title: 'Error',
        message: 'Manga not found',
        variant: 'error'
      })
      return
    }

    await handleUnfavourite({
      mangaId: id,
      mangaTitle: manga.title,
      onSuccess: () => {
        // Refresh library to update UI
        loadFavourites()
      },
      onError: (error) => {
        console.error('Unfavourite error:', error)
      }
    })
  }

  const filteredAll = filterManga(favourites)
  const hasCollections = collections.length > 0

  return (
    <div className="p-6">
      {/* Screen reader heading for page structure */}
      <h1 className="sr-only">Library</h1>

      {/* Live region for dynamic content updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {loading ? 'Loading library...' : `${filteredAll.length} manga in library`}
      </div>

      {/* Search Bar with Actions */}
      <div className="mb-6 flex gap-3 items-start">
        <div className="flex-1">
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
              className="h-9"
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
          disabled={!isOnline}
          aria-label="Check for updates"
          title={!isOnline ? 'Check for updates (offline)' : 'Check for updates (Ctrl+Shift+U)'}
          className="h-9"
        />
      </div>

      {/* Edit Collection Modal */}
      <EditCollectionModal
        collection={editingCollection}
        isSubmitting={isSubmittingEdit}
        onUpdate={handleUpdateCollection}
        onClose={() => setEditingCollection(null)}
      />

      {/* Loading State */}
      {loading && <LoadingState variant="skeleton" skeletonCount={12} />}

      {/* Error State */}
      {error && !loading && <EmptyState icon={<Warning48Regular />} message={error} />}

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
                <CollectionContextMenu
                  collection={contextMenuCollection}
                  position={contextMenuPosition}
                  onEdit={() => handleEditCollection(contextMenuCollection)}
                  onDelete={() =>
                    void handleDeleteCollection(
                      contextMenuCollection.id,
                      contextMenuCollection.name
                    )
                  }
                  onClose={() => {
                    setContextMenuCollection(null)
                    setContextMenuPosition(null)
                  }}
                />
              )}

              <TabPanel value="all">
                {filteredAll.length === 0 ? (
                  <EmptyState
                    icon={searchQuery ? <Search48Regular /> : <BookOpen48Regular />}
                    message={
                      searchQuery
                        ? "Can't find what you're looking for..."
                        : !isOnline
                          ? 'No downloaded manga. Go online to download manga for offline reading.'
                          : 'Nothing here yet! Start adding some manga from Browse.'
                    }
                    variant={searchQuery ? 'search' : 'default'}
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
                        icon={searchQuery ? <Search48Regular /> : <BookOpen48Regular />}
                        message={
                          searchQuery
                            ? `Nothing in "${collection.name}" matches that...`
                            : `Your "${collection.name}" collection is empty!`
                        }
                        variant={searchQuery ? 'search' : 'default'}
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
                  icon={searchQuery ? <Search48Regular /> : <BookOpen48Regular />}
                  message={
                    searchQuery
                      ? "Can't find what you're looking for..."
                      : !isOnline
                        ? 'No downloaded manga. Go online to download manga for offline reading.'
                        : 'Nothing here yet! Start adding some manga from Browse.'
                  }
                  variant={searchQuery ? 'search' : 'default'}
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
          onClose={() => clearImportResult()}
          onViewLibrary={() => {
            clearImportResult()
            // Already in library, just scroll to top
            globalThis.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {/* DexReader Export Dialog */}
      <DexReaderExportDialog
        isOpen={exportDialogOpen}
        savePath={exportFilePath}
        onClose={handleCloseExportDialog}
        onExport={handleExport}
        isExporting={isExporting}
        error={exportError}
      />

      <DexReaderImportDialog
        isOpen={importDialogOpen}
        filePath={importFilePath}
        onClose={handleCloseImportDialog}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
