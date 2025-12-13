import type { JSX } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchBar } from '@renderer/components/SearchBar'
import { FilterPanel } from '@renderer/components/FilterPanel'
import { MangaCard } from '@renderer/components/MangaCard'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { ErrorRecovery } from '@renderer/components/ErrorRecovery'
import { useSearchStore } from '@renderer/stores'
import { PublicationStatus } from '@renderer/stores/searchStore'
import {
  getCoverImageUrl,
  getAuthorName,
  getMangaTitle,
  mapPublicationStatus,
  getAvailableLanguages
} from '@renderer/utils/mangaHelpers'

export function BrowseView(): JSX.Element {
  const {
    query,
    results,
    loading,
    error,
    hasMore,
    filters,
    limit,
    setQuery,
    setFilters,
    setLimit,
    search,
    loadMore
  } = useSearchStore()

  const [showFilters, setShowFilters] = useState(true) // Show filters by default
  const [favourites, setFavourites] = useState<Set<string>>(new Set())

  // Calculate active filter count (excluding default content ratings)
  const filterCount =
    (filters.contentRating.length === 2 ? 0 : 1) + // Only count if not default (Safe + Suggestive)
    filters.publicationStatus.length +
    filters.publicationDemographic.length +
    filters.includedTags.length +
    filters.excludedTags.length

  // Ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Load initial popular manga on mount
  useEffect(() => {
    search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    console.log('Manga clicked:', id)
    // TODO: Navigate to manga detail view
  }

  const handleFavouriteToggle = (id: string): void => {
    setFavourites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    // TODO: Persist to library store
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
        <div style={{ marginBottom: '24px' }}>
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

      {/* Error State */}
      {error && !loading && <ErrorRecovery error={new Error(error)} onRetry={handleRetry} />}

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
                isFavourite={favourites.has(manga.id)}
                onClick={handleMangaClick}
                onFavourite={handleFavouriteToggle}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ height: '1px', margin: '24px 0' }} />

          {/* Loading more indicator */}
          {loading && hasMore && (
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
