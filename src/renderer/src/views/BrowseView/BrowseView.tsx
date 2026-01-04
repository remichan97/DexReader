import type { JSX } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Warning48Regular } from '@fluentui/react-icons'
import { SearchBar } from '@renderer/components/SearchBar'
import { FilterPanel } from '@renderer/components/FilterPanel'
import { MangaCard } from '@renderer/components/MangaCard'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { Button } from '@renderer/components/Button'
import { InfoBar } from '@renderer/components/InfoBar'
import { useSearchStore, useLibraryStore, useToastStore } from '@renderer/stores'
import { PublicationStatus, DEFAULT_FILTERS } from '@renderer/stores/searchStore'
import {
  getCoverImageUrl,
  getAuthorName,
  getMangaTitle,
  mapPublicationStatus,
  getAvailableLanguages
} from '@renderer/utils/mangaHelpers'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import './BrowseView.css'

export function BrowseView(): JSX.Element {
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
  const { isFavourite, toggleFavourite } = useLibraryStore()
  const showToast = useToastStore((state) => state.show)

  // Hide filters by default - users reveal when needed
  const [showFilters, setShowFilters] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(false) // Show info bar when filters out of view
  const filterPanelRef = useRef<HTMLDivElement>(null)

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

      // Cache manga metadata before toggling favorite (required for new favorites)
      try {
        await cacheMangaMetadata(manga)
      } catch (cacheError) {
        console.warn('Failed to cache manga metadata:', cacheError)
        // Continue with toggle - metadata might already exist
      }

      // Toggle favorite status in database
      const newStatus = await toggleFavourite(id)

      // Show toast notification
      showToast({
        title: newStatus ? 'Added to Library!' : 'Removed from Library!',
        message: getMangaTitle(manga),
        variant: 'info',
        duration: 3000
      })
    } catch (error) {
      console.error('Error toggling favourite:', error)
      showToast({
        title: 'Error',
        message: 'Failed to update library',
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
    setFilters({
      contentRating: [],
      publicationStatus: [],
      publicationDemographic: [],
      includedTags: [],
      excludedTags: []
    })
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

  return (
    <div style={{ padding: '24px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <SearchBar
          value={query}
          onChange={handleSearch}
          onFilterClick={handleFilterClick}
          filterCount={filterCount}
          placeholder="Search for manga"
        />
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div ref={filterPanelRef} style={{ marginBottom: '24px' }}>
          <FilterPanel
            filters={filters}
            limit={limit}
            onChange={handleFilterChange}
            onLimitChange={setLimit}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </div>
      )}

      {/* Sticky Filter Info Bar - Shows when filters are out of view */}
      <InfoBar
        visible={showFilterBar && showFilters && results.length > 0}
        text={
          filterCount > 0
            ? `${filterCount} filter${filterCount > 1 ? 's' : ''} active`
            : 'Browsing all manga'
        }
        actions={
          <>
            <Button variant="ghost" size="small" onClick={handleScrollToFilters}>
              Scroll to Filters
            </Button>
            <Button variant="secondary" size="small" onClick={handleResetFilters}>
              Reset to Default
            </Button>
          </>
        }
      />

      {/* Error State */}
      {error && !loading && (
        <div className="browse-error">
          <div className="browse-error__icon">
            <Warning48Regular />
          </div>
          <h3 className="browse-error__title">Couldn&apos;t load manga</h3>
          <p className="browse-error__message">
            Something went wrong while searching. This might be a connection issue or the service
            might be temporarily unavailable.
          </p>
          <div className="browse-error__actions">
            <Button variant="primary" onClick={handleRetry}>
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => setShowErrorDetails(!showErrorDetails)}>
              {showErrorDetails ? 'Hide' : 'Show'} technical details
            </Button>
          </div>
          {showErrorDetails && (
            <div className="browse-error__technical-details">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Stack Trace:</strong>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: '1.4' }}>
                    {error.stack}
                  </pre>
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
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--win-text-secondary)'
          }}
        >
          isFavourite
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No manga found</p>
          <p style={{ fontSize: '14px' }}>
            {query ? 'Try different search terms or filters' : 'Start searching to discover manga'}
          </p>
        </div>
      )}

      {/* Manga Grid */}
      {!loading && !error && results.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px'
            }}
          >
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
          <div ref={sentinelRef} style={{ height: '1px', margin: '24px 0' }} />

          {/* Load more error - inline, doesn't crash the view */}
          {loadMoreError && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: 'var(--win-bg-secondary)',
                borderRadius: '8px',
                margin: '0 auto',
                maxWidth: '600px'
              }}
            >
              <p
                style={{
                  color: 'var(--win-text-secondary)',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              >
                Couldn&apos;t load more manga. This might be a connection issue.
              </p>
              <Button variant="primary" onClick={retryLoadMore} size="small">
                Try Again
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {loading && hasMore && !loadMoreError && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ color: 'var(--win-text-secondary)', fontSize: '14px' }}>
                Loading more manga...
              </p>
            </div>
          )}

          {/* End of results */}
          {!hasMore && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ color: 'var(--win-text-secondary)', fontSize: '14px' }}>
                No more results to load
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
