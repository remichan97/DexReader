import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { SearchBar } from '@renderer/components/SearchBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { FilterChip } from '@renderer/components/FilterChip'
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
  Add24Regular,
  Info20Regular
} from '@fluentui/react-icons'
import { MangaGrid } from './components/MangaGrid'
import { CollectionContextMenu } from './components/CollectionContextMenu'
import { EditCollectionModal } from './components/EditCollectionModal'
import { useLibraryFilters } from './hooks/useLibraryFilters'
import { useCollectionManager } from './hooks/useCollectionManager'
import { useMihonImportExport } from './hooks/useMihonImportExport'
import { useDexReaderImportExport } from './hooks/useDexReaderImportExport'
import './LibraryView.css'
import { rendererLog } from '@renderer/services/logging.service'

export function LibraryView(): JSX.Element {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchHelp, setShowSearchHelp] = useState(false)

  // Stores
  const { favourites, loading, error, loadFavourites } = useLibraryStore()
  const { collections, loadCollections } = useCollectionsStore()
  const show = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Use custom hooks
  const { filterManga, activeFilters } = useLibraryFilters(searchQuery)

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
    handleAddToCollection,
    reloadCollectionManga
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
        rendererLog.error('[LibraryView] Unfavourite error:', error)
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
        {loading ? 'Loading your library...' : `${filteredAll.length} manga in library`}
      </div>

      {/* Search Bar with Actions */}
      <div className="mb-4 flex gap-3 items-start">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search your library (try: status:ongoing, author:Oda, tag:romance)"
          />
        </div>
        <Button
          variant="ghost"
          size="medium"
          icon={<Info20Regular />}
          onClick={() => setShowSearchHelp(!showSearchHelp)}
          aria-label="Search syntax help"
          title="Show search syntax help"
          className="h-9"
        />
        <Button
          variant="secondary"
          size="medium"
          icon={<Add24Regular />}
          onClick={() => setCreateDialogOpen(true)}
          aria-label="Create collection"
          title="Create a new collection"
          className="h-9"
        >
          Collection
        </Button>
      </div>

      {/* Search Help */}
      {showSearchHelp && (
        <div className="mb-4 p-4 bg-subtle border border-default rounded-lg">
          <h3 className="font-semibold mb-2">Search Syntax</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">status:ongoing</code> - Filter by
              status
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">tag:romance</code> - Filter by tag
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">downloaded:yes</code> - Show downloaded
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">author:Oda</code> - Filter by author
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">artist:Inoue</code> - Filter by artist
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">year:2024</code> - Filter by year
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">year:&gt;2020</code> - Year greater
              than
            </div>
            <div>
              <code className="px-1 py-0.5 bg-layer rounded">year:&lt;2019</code> - Year less than
            </div>
          </div>
          <p className="text-sm text-secondary mt-2">
            Combine filters:{' '}
            <code className="px-1 py-0.5 bg-layer rounded">
              one piece status:ongoing author:Oda
            </code>
          </p>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex gap-2 items-center flex-wrap">
          <span className="text-sm text-secondary">Active filters:</span>
          {activeFilters.map((filter) => (
            <FilterChip key={filter.key} label={filter.label} value={filter.value} />
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      <CreateCollectionDialog
        onCreate={handleCreateCollection}
        onClose={() => setSelectedMangaForCollection(null)}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        autoAddMangaId={selectedMangaForCollection || undefined}
      />

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
                        ? 'Nothing here matches your search'
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
                      ? 'Nothing here matches your search'
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
          onSaveComplete={reloadCollectionManga}
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
