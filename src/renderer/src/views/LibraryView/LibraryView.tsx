import type { JSX } from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button as FluentButton, ToggleButton } from '@fluentui/react-components'
import { originFrom } from '@renderer/utils/navigationOrigin'
import type { MangaWithMetadataContract } from '../../../../preload/window.types'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { SearchBar } from '@renderer/components/SearchBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { FilterChip } from '@renderer/components/FilterChip'
import { LoadingState } from '@renderer/components/LoadingState'
import { EmptyState } from '@renderer/components/EmptyState'
import { CreateCollectionDialog } from '@renderer/components/CreateCollectionDialog'
import { CollectionPickerDialog } from '@renderer/components/CollectionPickerDialog'
import { useLibraryStore, useCollectionsStore, useToastStore } from '@renderer/stores'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import {
  BookOpen48Regular,
  Search48Regular,
  Warning48Regular,
  Add24Regular,
  Info20Regular,
  ArrowDownload20Regular,
  ArrowDownload20Filled
} from '@fluentui/react-icons'
import { MangaGrid } from './components/MangaGrid'
import { CollectionContextMenu } from './components/CollectionContextMenu'
import { EditCollectionModal } from './components/EditCollectionModal'
import { useLibraryFilters } from './hooks/useLibraryFilters'
import { useCollectionManager } from './hooks/useCollectionManager'
import './LibraryView.css'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'

export function LibraryView(): JSX.Element {
  const { t } = useTranslation(['library', 'common'])
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchHelp, setShowSearchHelp] = useState(false)

  // Include Downloaded Titles toggle
  const [includeDownloaded, setIncludeDownloaded] = useState<boolean>(() => {
    const saved = localStorage.getItem('dexreader:library:includeDownloaded')
    return saved === 'true'
  })

  // Local manga list (loaded with includeDownloaded flag)
  const [mangaList, setMangaList] = useState<MangaWithMetadataContract[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedMangaListRef = useRef(false)

  // Stores - narrow selectors so this view doesn't re-render on unrelated
  // store field changes (e.g. loading/error flags this component never reads)
  const favourites = useLibraryStore((state) => state.favourites)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)
  const collections = useCollectionsStore((state) => state.collections)
  const loadCollections = useCollectionsStore((state) => state.loadCollections)
  const show = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Use custom hooks
  const { filterManga, activeFilters } = useLibraryFilters(searchQuery)

  const {
    editingCollection,
    isSubmittingEdit,
    collectionMangaMap,
    selectedMangaForCollection,
    pickerDialogOpen,
    createDialogOpen,
    setEditingCollection,
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

  // Load favourites and collections on mount
  useEffect(() => {
    loadFavourites() // Keep store updated for other components
    loadCollections()
  }, [loadFavourites, loadCollections])

  // Load manga list (with or without downloaded titles)
  useEffect(() => {
    const loadMangaList = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await globalThis.library.getLibraryManga({
          includeDownloaded
        })
        if (response.success && response.data) {
          setMangaList(response.data)
        } else {
          setError(response.error?.message || 'Failed to load library')
          setMangaList([])
        }
      } catch (err) {
        rendererLog.error('[LibraryView] Failed to load manga list:', err)
        setError('Failed to load library')
        setMangaList([])
      } finally {
        hasLoadedMangaListRef.current = true
        setLoading(false)
      }
    }

    void loadMangaList()
  }, [includeDownloaded])

  // The library can change without this view acting on it (a backup imported from the menu
  // while this view is open), so keep the grid in step with the favourites store. Silent: no
  // loading state, the grid just updates in place. Skipped until the first load has finished.
  useEffect(() => {
    if (!hasLoadedMangaListRef.current) return

    let cancelled = false

    const refreshMangaList = async (): Promise<void> => {
      try {
        const response = await globalThis.library.getLibraryManga({ includeDownloaded })
        if (!cancelled && response.success && response.data) {
          setMangaList(response.data)
        }
      } catch (err) {
        rendererLog.error('[LibraryView] Failed to refresh manga list:', err)
      }
    }

    void refreshMangaList()

    return () => {
      cancelled = true
    }
    // includeDownloaded has its own (loading) effect above; only favourites changes belong here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favourites])

  // Persist toggle preference
  useEffect(() => {
    localStorage.setItem('dexreader:library:includeDownloaded', String(includeDownloaded))
  }, [includeDownloaded])

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
  }

  const handleMangaClick = (id: string): void => {
    navigate(`/browse/${id}`, { state: originFrom(location) })
  }

  const handleRemoveFromLibrary = async (id: string): Promise<void> => {
    const manga = favourites.find((m) => m.mangaId === id)

    if (!manga) {
      show({
        title: t('library:toasts.error'),
        message: t('library:toasts.mangaNotFound'),
        variant: 'error'
      })
      return
    }

    await handleUnfavourite({
      mangaId: id,
      mangaTitle: manga.title,
      onSuccess: async () => {
        // Refresh library store to update UI
        loadFavourites()
        // Reload manga list to reflect the change
        const response = await globalThis.library.getLibraryManga({ includeDownloaded })
        if (response.success && response.data) {
          setMangaList(response.data)
        }
      },
      onError: (error) => {
        rendererLog.error('[LibraryView] Unfavourite error:', error)
      }
    })
  }

  const handleAddToLibrary = async (id: string): Promise<void> => {
    try {
      await globalThis.library.toggleFavourite(id)
      show({
        title: t('library:toasts.addedToLibrary'),
        message: t('library:toasts.addedSuccess'),
        variant: 'success'
      })
      // Refresh to update UI
      loadFavourites()
      // Reload manga list to reflect the change
      const response = await globalThis.library.getLibraryManga({ includeDownloaded })
      if (response.success && response.data) {
        setMangaList(response.data)
      }
    } catch (error) {
      show({
        title: t('library:toasts.error'),
        message: t('library:toasts.failedToAdd'),
        variant: 'error'
      })
      rendererLog.error('[LibraryView] handleAddToLibrary error:', error)
    }
  }

  // Apply filters to manga list
  const filteredManga = useMemo(() => filterManga(mangaList), [mangaList, filterManga])
  const hasCollections = collections.length > 0
  const favouriteCount = mangaList.filter((m) => m.isFavourite).length
  const downloadedCount = mangaList.length - favouriteCount

  return (
    <div className="p-6">
      {/* Screen reader heading for page structure */}
      <h1 className="sr-only">{t('library:pageTitle')}</h1>

      {/* Live region for dynamic content updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {loading
          ? t('library:liveRegion.loading')
          : includeDownloaded
            ? t('library:liveRegion.countWithDownloads', {
                count: filteredManga.length,
                favorited: favouriteCount,
                downloaded: downloadedCount
              })
            : t('library:liveRegion.count', { count: filteredManga.length })}
      </div>

      {/* Search Bar with Actions */}
      <div className="mb-4 flex gap-3 items-start">
        {/* Search Bar with Integrated Controls */}
        <div className="library-view__search-wrapper flex-1">
          <div className="library-view__search-container">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t('library:searchPlaceholder')}
              actions={
                <>
                  {/* Download Toggle Button */}
                  <ToggleButton
                    appearance="transparent"
                    size="small"
                    checked={includeDownloaded}
                    onClick={() => setIncludeDownloaded(!includeDownloaded)}
                    icon={
                      includeDownloaded ? <ArrowDownload20Filled /> : <ArrowDownload20Regular />
                    }
                    aria-label={
                      includeDownloaded
                        ? t('library:downloadToggle.hideDownloaded')
                        : t('library:downloadToggle.includeDownloaded')
                    }
                    title={
                      includeDownloaded && downloadedCount > 0
                        ? t('library:downloadToggle.showing', {
                            count: downloadedCount,
                            s: downloadedCount === 1 ? '' : 's'
                          })
                        : t('library:downloadToggle.includeDownloaded')
                    }
                  />

                  {/* Search Help Button */}
                  <FluentButton
                    appearance="transparent"
                    size="small"
                    onClick={() => setShowSearchHelp(!showSearchHelp)}
                    icon={<Info20Regular />}
                    aria-label={t('library:searchHelpButton')}
                    title={t('library:searchHelpButton')}
                  />
                </>
              }
            />
          </div>
        </div>

        {/* Action Button (Separated) */}
        <Button
          variant="secondary"
          size="medium"
          icon={<Add24Regular />}
          onClick={() => setCreateDialogOpen(true)}
          aria-label={t('library:createCollectionButton')}
          title={t('library:createCollectionButton')}
        >
          {t('library:createCollectionButton')}
        </Button>
      </div>

      {/* Search Help */}
      {showSearchHelp && (
        <div className="mb-4 p-4 bg-subtle border rounded-lg">
          <h3 className="font-semibold mb-2">{t('library:searchSyntax.title')}</h3>
          <div className="grid grid-cols-2 gap-2 text-body">
            <div>
              <code>status:ongoing</code> - {t('library:searchSyntax.examples.status')}
            </div>
            <div>
              <code>tag:romance</code> - {t('library:searchSyntax.examples.tag')}
            </div>
            <div>
              <code>downloaded:yes</code> - {t('library:searchSyntax.examples.downloaded')}
            </div>
            <div>
              <code>author:Oda</code> - {t('library:searchSyntax.examples.author')}
            </div>
            <div>
              <code>artist:Inoue</code> - {t('library:searchSyntax.examples.artist')}
            </div>
            <div>
              <code>year:2024</code> - {t('library:searchSyntax.examples.year')}
            </div>
            <div>
              <code>year:&gt;2020</code> - {t('library:searchSyntax.examples.yearGreater')}
            </div>
            <div>
              <code>year:&lt;2019</code> - {t('library:searchSyntax.examples.yearLess')}
            </div>
          </div>
          <p className="text-body text-secondary mt-2">{t('library:searchSyntax.combine')}</p>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex gap-2 items-center flex-wrap">
          <span className="text-body text-secondary">{t('library:activeFilters')}</span>
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
                  {t('library:tabs.all')}{' '}
                  <Badge variant="default" size="small">
                    {favourites.length}
                  </Badge>
                </Tab>
                {collections.map((collection) => (
                  // Tab and its overflow menu are siblings, not nested - Tab renders as a
                  // real <button>, which can't contain another interactive button. Grouped
                  // in a wrapper (rather than a bare Fragment) so the menu button can reveal
                  // on hover/focus of the pair - see .library-view__collection-tab in
                  // LibraryView.css.
                  <div key={collection.id} className="library-view__collection-tab">
                    <Tab value={String(collection.id)}>
                      {collection.name}{' '}
                      <Badge variant="default" size="small">
                        {collectionMangaMap[collection.id]?.length || 0}
                      </Badge>
                    </Tab>
                    <CollectionContextMenu
                      collectionName={collection.name}
                      onEdit={() => handleEditCollection(collection)}
                      onDelete={() => void handleDeleteCollection(collection.id, collection.name)}
                    />
                  </div>
                ))}
              </TabList>

              <TabPanel value="all">
                {filteredManga.length === 0 ? (
                  <EmptyState
                    icon={searchQuery ? <Search48Regular /> : <BookOpen48Regular />}
                    message={
                      searchQuery
                        ? t('library:emptyState.noSearchResults')
                        : !isOnline
                          ? t('library:emptyState.noDownloaded')
                          : t('library:emptyState.noManga')
                    }
                    variant={searchQuery ? 'search' : 'default'}
                  />
                ) : (
                  <MangaGrid
                    items={filteredManga}
                    onFavourite={handleRemoveFromLibrary}
                    onClick={handleMangaClick}
                    onAddToCollection={handleAddToCollection}
                    onAddToLibrary={handleAddToLibrary}
                    hasCollections={hasCollections}
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
                            ? t('library:emptyState.noMatchInCollection', { name: collection.name })
                            : t('library:emptyState.emptyCollection', { name: collection.name })
                        }
                        variant={searchQuery ? 'search' : 'default'}
                      />
                    ) : (
                      <MangaGrid
                        items={collectionManga}
                        onFavourite={handleRemoveFromLibrary}
                        onClick={handleMangaClick}
                        onAddToCollection={handleAddToCollection}
                        onAddToLibrary={handleAddToLibrary}
                        hasCollections={hasCollections}
                      />
                    )}
                  </TabPanel>
                )
              })}
            </Tabs>
          ) : (
            // No collections - show all manga in a simple grid
            <>
              {filteredManga.length === 0 ? (
                <EmptyState
                  icon={searchQuery ? <Search48Regular /> : <BookOpen48Regular />}
                  message={
                    searchQuery
                      ? t('library:emptyState.noSearchResults')
                      : !isOnline
                        ? t('library:emptyState.noDownloaded')
                        : t('library:emptyState.noManga')
                  }
                  variant={searchQuery ? 'search' : 'default'}
                />
              ) : (
                <MangaGrid
                  items={filteredManga}
                  onFavourite={handleRemoveFromLibrary}
                  onClick={handleMangaClick}
                  onAddToCollection={handleAddToCollection}
                  onAddToLibrary={handleAddToLibrary}
                  hasCollections={hasCollections}
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
    </div>
  )
}
