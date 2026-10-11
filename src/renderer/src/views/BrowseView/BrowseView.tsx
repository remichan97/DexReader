import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { originFrom } from '@renderer/utils/navigationOrigin'
import { Warning48Regular, CloudOff48Regular, Search48Regular } from '@fluentui/react-icons'
import { SearchBar } from '@renderer/components/SearchBar'
import { EmptyState } from '@renderer/components/EmptyState'
import { FilterPanel } from '@renderer/components/FilterPanel'
import { MangaCard } from '@renderer/components/MangaCard'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { Button } from '@renderer/components/Button'
import { InfoBar } from '@renderer/components/InfoBar'
import { Modal } from '@renderer/components/Modal'
import { SavePresetDialog } from '@renderer/components/SavePresetDialog'
import { useSearchStore, useToastStore, useConnectivityStore } from '@renderer/stores'
import { DEFAULT_FILTERS, DEFAULT_LIMIT } from '@renderer/stores/searchStore'
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
  const location = useLocation()
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

  // Filter Panel lives in a dedicated Modal rather than an inline toggled block. Everything
  // inside it - manual edits, picking a preset, Clear Filters - edits this draft, not the
  // committed query/filters/limit above. Nothing outside the modal (the search bar's filter
  // badge, the sticky InfoBar, the actual search results) reacts until Apply Filters commits
  // the draft - see handleApplyFilters and openFilterModal below.
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(filters)
  const [draftLimit, setDraftLimit] = useState(limit)
  const [draftQuery, setDraftQuery] = useState(query)

  // Saved search presets - load into and save from the draft above, not the committed state
  const {
    presets,
    appliedPresetId,
    setAppliedPresetId,
    showSaveDialog,
    setShowSaveDialog,
    handlePresetSelect,
    handleSavePreset,
    handleDeletePreset
  } = useSearchPresets(t, showToast, {
    query: draftQuery,
    filters: draftFilters,
    limit: draftLimit,
    setQuery: setDraftQuery,
    setFilters: setDraftFilters,
    setLimit: setDraftLimit
  })

  // Calculate active filter count (excluding default content ratings)
  const filterCount =
    (filters.contentRating.length === 2 ? 0 : 1) + // Only count if not default (Safe + Suggestive)
    filters.publicationStatus.length +
    filters.publicationDemographic.length +
    filters.includedTags.length +
    filters.excludedTags.length

  // Sticky filter info bar: shown once filterCount > 0, but only once the search bar
  // (and its own filter-count badge) has scrolled out of view, so there's never a
  // moment with two filter indicators on screen at once.
  const { searchBarRef, showFilterBar } = useStickyFilterBar(filterCount > 0)

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
    navigate(`/browse/${id}`, { state: originFrom(location) })
  }

  // Re-seeds the draft from the currently committed state every time the modal opens, so
  // a previous open-then-discard (closed without Apply) never leaks into the next session.
  const openFilterModal = (): void => {
    setDraftFilters(filters)
    setDraftLimit(limit)
    setDraftQuery(query)
    setIsFilterModalOpen(true)
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>): void => {
    setDraftFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleApplyFilters = (): void => {
    setFilters(draftFilters)
    setLimit(draftLimit)
    setQuery(draftQuery)
    search()
    setIsFilterModalOpen(false)
  }

  // Resets the draft to the default filters only - mirrors "No Preset" in the preset
  // selector and, like it, doesn't search: the modal stays open showing the reset state
  // until Apply Filters commits it.
  const handleClearFilters = (): void => {
    setDraftFilters(DEFAULT_FILTERS)
    setDraftLimit(DEFAULT_LIMIT)
    setAppliedPresetId(null) // Clear preset selection
  }

  const handleRetry = (): void => {
    search()
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
      <div ref={searchBarRef} className="mb-4">
        <SearchBar
          value={query}
          onChange={handleSearch}
          onFilterClick={openFilterModal}
          filterCount={filterCount}
          placeholder={t('browse:searchPlaceholder')}
        />
      </div>

      {/* Filter Panel - lives in a dedicated Modal rather than an inline toggled block.
          Actions live in the Modal's own footer (DialogActions, outside the scrollable
          content) rather than inside FilterPanel, so they stay pinned at the bottom per
          Fluent's dialog guidance instead of scrolling away with the filter controls. */}
      <Modal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title={t('browse:filter.modalTitle')}
        size="large"
        footer={
          <>
            <Button
              variant="secondary"
              size="small"
              onClick={handleClearFilters}
              title={t('browse:filter.tooltips.reset')}
            >
              {t('browse:clearFiltersButton')}
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowSaveDialog(true)}
              title={t('browse:filter.tooltips.savePreset')}
            >
              {t('browse:savePresetButton')}
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleApplyFilters}
              title={t('browse:filter.tooltips.apply')}
            >
              {t('browse:applyFiltersButton')}
            </Button>
          </>
        }
      >
        <FilterPanel
          filters={draftFilters}
          limit={draftLimit}
          onChange={handleFilterChange}
          onLimitChange={setDraftLimit}
          currentPresetId={appliedPresetId}
          onPresetSelect={handlePresetSelect}
          onPresetDelete={handleDeletePreset}
        />
      </Modal>

      {/* Sticky Filter Info Bar - persists as a "browsing filtered results" indicator
          whenever filters are active, surfacing once the search bar (and its own filter
          badge) scrolls out of view, independent of whether the Filter modal is open. */}
      <InfoBar
        visible={showFilterBar && filterCount > 0 && results.length > 0}
        text={t('browse:filterInfo.activeFilters', {
          count: filterCount,
          s: filterCount > 1 ? 's' : ''
        })}
        actions={
          <>
            <Button variant="ghost" size="small" onClick={openFilterModal}>
              {t('browse:filterInfo.editFilters')}
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
              <p className="text-secondary text-body mb-4">{t('browse:loadMore.error')}</p>
              <Button variant="primary" onClick={retryLoadMore} size="small">
                {t('common:button.tryAgain')}
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {loading && hasMore && !loadMoreError && (
            <div className="text-center p-6">
              <p className="text-secondary text-body">{t('browse:loadMore.loading')}</p>
            </div>
          )}

          {/* End of results */}
          {!hasMore && (
            <div className="text-center p-6">
              <p className="text-secondary text-body">{t('browse:loadMore.noMoreResults')}</p>
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
          searchQuery: draftQuery,
          filters: draftFilters,
          resultsPerPage: draftLimit
        }}
        onSave={handleSavePreset}
      />
    </div>
  )
}
