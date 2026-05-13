import type { JSX } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Warning48Regular, CloudOff48Regular, Search48Regular } from '@fluentui/react-icons'
import { SearchBar } from '@renderer/components/SearchBar'
import { EmptyState } from '@renderer/components/EmptyState'
import { FilterPanel } from '@renderer/components/FilterPanel'
import { MangaCard } from '@renderer/components/MangaCard'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { Button } from '@renderer/components/Button'
import { InfoBar } from '@renderer/components/InfoBar'
import { SavePresetDialog } from '@renderer/components/SavePresetDialog'
import {
  useSearchStore,
  useLibraryStore,
  useToastStore,
  useConnectivityStore,
  useSearchPresetsStore
} from '@renderer/stores'
import {
  PublicationStatus,
  DEFAULT_FILTERS,
  type IncludedTagsMode,
  type OrderOptions,
  type OrderDirection
} from '@renderer/stores/searchStore'
import {
  getCoverImageUrl,
  getAuthorName,
  getMangaTitle,
  mapPublicationStatus,
  getAvailableLanguages
} from '@renderer/utils/mangaHelpers'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import './BrowseView.css'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'

export function BrowseView(): JSX.Element {
  const { t } = useTranslation(['browse', 'common'])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false)
  const {
    query,
    results,
    loading,
    error,
    loadMoreError,
    hasMore,
    filters,
    limit,
    setQuery,
    setFilters,
    setLimit,
    search,
    loadMore,
    retryLoadMore
  } = useSearchStore()

  // Library store for favorite management
  const { isFavourite, toggleFavourite, loadFavourites } = useLibraryStore()
  const showToast = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Search presets store
  const { presets, loadPresets, createPreset, deletePreset, updateLastUsedAt } =
    useSearchPresetsStore()

  // Hide filters by default - users reveal when needed
  const [showFilters, setShowFilters] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(false) // Show info bar when filters out of view
  const filterPanelRef = useRef<HTMLDivElement>(null)

  // Preset state
  const [appliedPresetId, setAppliedPresetId] = useState<number | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Calculate active filter count (excluding default content ratings)
  const filterCount =
    (filters.contentRating.length === 2 ? 0 : 1) + // Only count if not default (Safe + Suggestive)
    filters.publicationStatus.length +
    filters.publicationDemographic.length +
    filters.includedTags.length +
    filters.excludedTags.length

  // Ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(false)

  // Helper functions to convert between backend and frontend filter types
  const convertToFrontendFilters = (
    backendFilters: (typeof presets)[number]['filters']
  ): typeof filters => {
    return {
      contentRating: backendFilters.contentRating,
      publicationStatus: backendFilters.publicationStatus ? [backendFilters.publicationStatus] : [],
      publicationDemographic: backendFilters.publicationDemographic
        ? [backendFilters.publicationDemographic]
        : [],
      includedTags: backendFilters.includedTags || [],
      excludedTags: backendFilters.excludedTags || [],
      includedTagsMode: backendFilters.includedTagsMode as unknown as IncludedTagsMode,
      availableTranslatedLanguage: backendFilters.availableTranslatedLanguages,
      sortBy: backendFilters.sortBy as unknown as OrderOptions,
      sortDirection: backendFilters.sortDirection as unknown as OrderDirection
    }
  }

  const convertToBackendFilters = (
    frontendFilters: typeof filters
  ): (typeof presets)[number]['filters'] => {
    return {
      contentRating: frontendFilters.contentRating,
      publicationStatus: frontendFilters.publicationStatus[0], // Take first item or undefined
      publicationDemographic: frontendFilters.publicationDemographic[0] || undefined, // Take first or undefined
      includedTags: frontendFilters.includedTags,
      excludedTags: frontendFilters.excludedTags,
      includedTagsMode:
        frontendFilters.includedTagsMode as unknown as (typeof presets)[number]['filters']['includedTagsMode'],
      availableTranslatedLanguages: frontendFilters.availableTranslatedLanguage,
      resultPerPage: limit,
      sortBy: frontendFilters.sortBy as unknown as (typeof presets)[number]['filters']['sortBy'],
      sortDirection:
        frontendFilters.sortDirection as unknown as (typeof presets)[number]['filters']['sortDirection']
    }
  }

  // Handle tag parameter from URL and apply to filters
  useEffect(() => {
    const tagId = searchParams.get('tag')
    if (tagId) {
      // Reset to default filters and apply only the tag filter
      setQuery('')
      setFilters({
        ...DEFAULT_FILTERS,
        includedTags: [tagId]
      })
      setSearchParams({}) // Clear query params
      // Trigger search immediately for URL-based tag navigation
      setTimeout(() => search(), 0)
      initialLoadRef.current = true
    } else if (!initialLoadRef.current) {
      // Load initial popular manga on mount (no tag filter)
      search()
      initialLoadRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load presets on mount
  useEffect(() => {
    loadPresets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Observe filter panel visibility to show/hide info bar
  useEffect(() => {
    const filterPanel = filterPanelRef.current
    if (!filterPanel || !showFilters) {
      setShowFilterBar(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show info bar when filter panel is not visible
        setShowFilterBar(!entry.isIntersecting)
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '0px'
      }
    )

    observer.observe(filterPanel)

    return () => {
      observer.disconnect()
    }
  }, [showFilters])

  // Infinite scroll: load more when sentinel comes into view
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && !loading && hasMore) {
        loadMore()
      }
    },
    [loading, hasMore, loadMore]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '200px', // Trigger 200px before reaching the sentinel
      threshold: 0
    })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection])

  // Clear offline errors and retry search when going online
  useEffect(() => {
    if (isOnline && error?.message.toLowerCase().includes('offline')) {
      // User just came back online, retry the search
      search()
    }
  }, [isOnline, error, search])

  const handleSearch = (newQuery: string): void => {
    setQuery(newQuery)
    search()
  }

  const handleMangaClick = (id: string): void => {
    navigate(`/browse/${id}`)
  }

  const handleFavouriteToggle = async (id: string): Promise<void> => {
    try {
      // Find the manga for caching and toast message
      const manga = results.find((m) => m.id === id)

      if (!manga) {
        throw new Error('Manga not found in results')
      }

      const currentlyFavourited = isFavourite(id)

      if (currentlyFavourited) {
        // Unfavouriting - show dialog with download options
        await handleUnfavourite({
          mangaId: id,
          mangaTitle: getMangaTitle(manga),
          onSuccess: () => {
            // Refresh library store to update heart icon
            loadFavourites()
          }
        })
      } else {
        // Favouriting - cache metadata and toggle
        try {
          await cacheMangaMetadata(manga)
        } catch {
          // Continue with toggle - metadata might already exist
        }

        await toggleFavourite(id)

        showToast({
          title: t('browse:toasts.addedToLibrary'),
          message: getMangaTitle(manga),
          variant: 'info',
          duration: 3000
        })
      }
    } catch (error) {
      rendererLog.error('[BrowseView] Error toggling favourite:', error)
      showToast({
        title: t('browse:toasts.error'),
        message: t('browse:toasts.failedToUpdate'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleFilterClick = (): void => {
    setShowFilters(!showFilters)
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>): void => {
    setFilters(newFilters)
  }

  const handleApplyFilters = (): void => {
    search()
  }

  const handleClearFilters = (): void => {
    setFilters(DEFAULT_FILTERS)
    setAppliedPresetId(null) // Clear preset selection
    search()
  }

  // Preset handlers
  const handlePresetSelect = (presetId: number | null): void => {
    if (presetId === null) {
      // Clear preset
      setAppliedPresetId(null)
      return
    }

    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return

    // Apply preset to search state - convert backend format to frontend format
    setQuery(preset.searchQuery || '')
    setFilters(convertToFrontendFilters(preset.filters))
    setLimit(preset.resultsPerPage)

    // Mark as applied and update last used
    setAppliedPresetId(preset.id)
    updateLastUsedAt(preset.id)

    // Trigger search
    search()

    showToast({
      title: t('browse:toasts.presetLoaded'),
      message: preset.name,
      variant: 'info',
      duration: 2000
    })
  }

  const handleSavePreset = async (name: string, setAsDefault: boolean): Promise<void> => {
    try {
      const backendFilters = convertToBackendFilters(filters)
      const preset = await createPreset({
        name,
        searchQuery: query,
        filters: backendFilters,
        resultsPerPage: limit,
        setAsDefault
      })

      setAppliedPresetId(preset?.id ?? null)

      showToast({
        title: t('browse:toasts.presetSaved'),
        message: name,
        variant: 'success',
        duration: 2000
      })
    } catch (error) {
      rendererLog.error('[BrowseView] Error saving preset:', error)
      showToast({
        title: t('browse:toasts.error'),
        message: error instanceof Error ? error.message : t('browse:toasts.failedToSave'),
        variant: 'error',
        duration: 4000
      })
      throw error // Re-throw to let dialog handle it
    }
  }

  const handleDeletePreset = async (id: number, name: string): Promise<void> => {
    try {
      await deletePreset(id)

      // Clear applied preset if it was deleted
      if (appliedPresetId === id) {
        setAppliedPresetId(null)
      }

      showToast({
        title: t('browse:toasts.presetDeleted'),
        message: name,
        variant: 'info',
        duration: 2000
      })
    } catch (error) {
      rendererLog.error('[BrowseView] Error deleting preset:', error)
      showToast({
        title: t('browse:toasts.error'),
        message: t('browse:toasts.failedToDelete'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleRetry = (): void => {
    search()
  }

  const handleScrollToFilters = (): void => {
    filterPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleResetFilters = (): void => {
    setFilters(DEFAULT_FILTERS)
    setQuery('')
    search()
  }

  // Early return for offline state
  if (!isOnline) {
    return (
      <div className="browse-view">
        <div className="browse-view__header"></div>
        <EmptyState
          icon={<CloudOff48Regular />}
          title={t('common:message.info.youreOffline')}
          message={t('browse:offlineState.message')}
          action={{
            label: t('browse:offlineState.action'),
            onClick: () => navigate('/library'),
            variant: 'primary'
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Screen reader heading for page structure */}
      <h1 className="sr-only">{t('browse:pageTitle')}</h1>

      {/* Live region for search results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {loading && !results.length
          ? t('browse:liveRegion.searching')
          : results.length > 0
            ? t('browse:liveRegion.found', { count: results.length }) +
              (hasMore ? t('browse:liveRegion.hasMore') : '')
            : query
              ? t('browse:liveRegion.noResults')
              : ''}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar
          value={query}
          onChange={handleSearch}
          onFilterClick={handleFilterClick}
          filterCount={filterCount}
          placeholder={t('browse:searchPlaceholder')}
        />
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div ref={filterPanelRef} className="mb-6">
          <FilterPanel
            filters={filters}
            limit={limit}
            onChange={handleFilterChange}
            onLimitChange={setLimit}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            onSavePreset={() => setShowSaveDialog(true)}
            currentPresetId={appliedPresetId}
            onPresetSelect={handlePresetSelect}
            onPresetDelete={handleDeletePreset}
          />
        </div>
      )}

      {/* Sticky Filter Info Bar - Shows when filters are out of view */}
      <InfoBar
        visible={showFilterBar && showFilters && results.length > 0}
        text={
          filterCount > 0
            ? t('browse:filterInfo.activeFilters', {
                count: filterCount,
                s: filterCount > 1 ? 's' : ''
              })
            : t('browse:filterInfo.browsingAll')
        }
        actions={
          <>
            <Button variant="ghost" size="small" onClick={handleScrollToFilters}>
              {t('browse:filterInfo.scrollToFilters')}
            </Button>
            <Button variant="secondary" size="small" onClick={handleResetFilters}>
              {t('browse:filterInfo.resetToDefault')}
            </Button>
          </>
        }
      />

      {/* Error State */}
      {error && !loading && (
        <div className="browse-error flex flex-col items-center gap-3">
          <div className="browse-error__icon">
            <Warning48Regular />
          </div>
          <h3 className="browse-error__title">{t('browse:errorState.title')}</h3>
          <p className="browse-error__message">{t('browse:errorState.message')}</p>
          <div className="browse-error__actions flex gap-2">
            <Button variant="primary" onClick={handleRetry}>
              {t('common:button.tryAgain')}
            </Button>
            <Button variant="ghost" onClick={() => setShowErrorDetails(!showErrorDetails)}>
              {showErrorDetails
                ? t('common:action.hide')
                : t('browse:errorState.showDetailsButton')}
            </Button>
          </div>
          {showErrorDetails && (
            <div className="browse-error__technical-details">
              <div>
                <strong>{t('common:label.error')}</strong> {error.message}
              </div>
              {error.stack && (
                <div className="mt-2">
                  <strong>{t('common:label.stackTrace')}</strong>
                  <pre className="browse-view__stack-trace">{error.stack}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && results.length === 0 && <SkeletonGrid count={20} />}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && (
        <EmptyState
          icon={query ? <Search48Regular /> : undefined}
          message={t('browse:emptyState.noResults')}
          variant={query ? 'search' : 'default'}
        />
      )}

      {/* Manga Grid */}
      {!loading && !error && results.length > 0 && (
        <>
          <div className="browse-view__manga-grid">
            {results.map((manga) => (
              <MangaCard
                key={manga.id}
                id={manga.id}
                coverUrl={getCoverImageUrl(manga)}
                title={getMangaTitle(manga)}
                author={getAuthorName(manga)}
                status={mapPublicationStatus(
                  (manga.attributes as { status: PublicationStatus }).status
                )}
                languages={getAvailableLanguages(manga)}
                isFavourite={isFavourite(manga.id)}
                onClick={handleMangaClick}
                onFavourite={handleFavouriteToggle}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="browse-view__sentinel" />

          {/* Load more error - inline, doesn't crash the view */}
          {loadMoreError && (
            <div className="browse-view__load-more-error">
              <p className="text-secondary text-body mb-4">
                Couldn&apos;t load more manga. This might be a connection issue.
              </p>
              <Button variant="primary" onClick={retryLoadMore} size="small">
                Try Again
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {loading && hasMore && !loadMoreError && (
            <div className="text-center p-6">
              <p className="text-secondary text-body">Loading more manga...</p>
            </div>
          )}

          {/* End of results */}
          {!hasMore && (
            <div className="text-center p-6">
              <p className="text-secondary text-body">No more results to load</p>
            </div>
          )}
        </>
      )}

      {/* Save Preset Dialog */}
      <SavePresetDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        initialName={
          appliedPresetId ? presets.find((p) => p.id === appliedPresetId)?.name || '' : ''
        }
        currentSearchState={{
          searchQuery: query,
          filters,
          resultsPerPage: limit
        }}
        onSave={handleSavePreset}
      />
    </div>
  )
}
