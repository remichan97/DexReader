import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
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
import { useSearchStore, useToastStore, useConnectivityStore } from '@renderer/stores'
import { DEFAULT_FILTERS } from '@renderer/stores/searchStore'
import { getMangaTitle, mapPublicationStatus } from '@renderer/utils/mangaHelpers'
import './BrowseView.css'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useInfiniteScroll } from './hooks/useInfiniteScroll'
import { useStickyFilterBar } from './hooks/useStickyFilterBar'
import { useFavouriteToggle } from './hooks/useFavouriteToggle'
import { useSearchPresets } from './hooks/useSearchPresets'

export function BrowseView(): JSX.Element {
  const { t } = useTranslation(['browse', 'common'])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false)
  const query = useSearchStore((state) => state.query)
  const results = useSearchStore((state) => state.results)
  const loading = useSearchStore((state) => state.loading)
  const error = useSearchStore((state) => state.error)
  const loadMoreError = useSearchStore((state) => state.loadMoreError)
  const hasMore = useSearchStore((state) => state.hasMore)
  const filters = useSearchStore((state) => state.filters)
  const limit = useSearchStore((state) => state.limit)
  const setQuery = useSearchStore((state) => state.setQuery)
  const setFilters = useSearchStore((state) => state.setFilters)
  const setLimit = useSearchStore((state) => state.setLimit)
  const search = useSearchStore((state) => state.search)
  const loadMore = useSearchStore((state) => state.loadMore)
  const retryLoadMore = useSearchStore((state) => state.retryLoadMore)

  const showToast = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Favourite toggling (with metadata caching + shared unfavourite flow)
  const { isFavourite, handleFavouriteToggle } = useFavouriteToggle(results, t, showToast)

  // Saved search presets
  const {
    presets,
    appliedPresetId,
    setAppliedPresetId,
    showSaveDialog,
    setShowSaveDialog,
    handlePresetSelect,
    handleSavePreset,
    handleDeletePreset
  } = useSearchPresets(t, showToast)

  // Hide filters by default - users reveal when needed
  const [showFilters, setShowFilters] = useState(false)
  const { filterPanelRef, showFilterBar } = useStickyFilterBar(showFilters)

  // Calculate active filter count (excluding default content ratings)
  const filterCount =
    (filters.contentRating.length === 2 ? 0 : 1) + // Only count if not default (Safe + Suggestive)
    filters.publicationStatus.length +
    filters.publicationDemographic.length +
    filters.includedTags.length +
    filters.excludedTags.length

  // Ref for infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(loading, hasMore, loadMore)
  const initialLoadRef = useRef(false)

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
                coverUrl={manga.coverUrl || '/placeholder-cover.jpg'}
                title={getMangaTitle(manga)}
                author={manga.authors[0]?.name || 'Unknown'}
                status={mapPublicationStatus(manga.status)}
                languages={manga.availableTranslatedLanguages}
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
