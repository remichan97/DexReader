import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { MangaCard } from '@renderer/components/MangaCard'
import { SearchBar } from '@renderer/components/SearchBar'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { useLibraryStore, useToastStore } from '@renderer/stores'
import {
  BookOpen48Regular,
  Search48Regular,
  Warning48Regular,
  ArrowClockwise24Regular
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
}

const MangaGrid = ({ items, onFavourite, onClick }: MangaGridProps): JSX.Element => (
  <div className="library__grid">
    {items.map((manga) => (
      <MangaCard
        key={manga.mangaId}
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
    ))}
  </div>
)

// Mock user categories - empty by default (collections feature in next phase)
const mockCategories: Array<{
  id: string
  name: string
  mangaIds: string[]
}> = []

export function LibraryView(): JSX.Element {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Stores
  const { favourites, loading, error, loadFavourites, toggleFavourite } = useLibraryStore()
  const show = useToastStore((state) => state.show)

  // Load favourites on mount
  useEffect(() => {
    loadFavourites()
  }, [loadFavourites])

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
  }

  const handleMangaClick = (id: string): void => {
    navigate(`/browse/${id}`)
  }

  const handleCheckUpdates = async (): Promise<void> => {
    show({
      title: 'Checking for updates...',
      message: 'This may take a moment',
      variant: 'info',
      duration: 2000
    })

    // TODO: Implement update check logic in next phase
    // For now, just show a placeholder message
    setTimeout(() => {
      show({
        title: 'Update check complete',
        message: 'Your library is up to date',
        variant: 'success',
        duration: 3000
      })
    }, 2000)
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
  const hasCategories = mockCategories.length > 0

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
        <Button
          variant="primary"
          size="medium"
          icon={<ArrowClockwise24Regular />}
          onClick={handleCheckUpdates}
          aria-label="Check for updates"
          title="Check for updates (Ctrl+R)"
          style={{ height: '35px' }}
        />
      </div>

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
          {/* Category Tabs - only shown when user has categories */}
          {hasCategories ? (
            <Tabs defaultValue="all">
              <TabList>
                <Tab value="all">
                  All{' '}
                  <Badge variant="default" size="small">
                    {favourites.length}
                  </Badge>
                </Tab>
                {mockCategories.map((category) => (
                  <Tab key={category.id} value={category.id}>
                    {category.name}{' '}
                    <Badge variant="info" size="small">
                      {category.mangaIds.length}
                    </Badge>
                  </Tab>
                ))}
              </TabList>

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
                  />
                )}
              </TabPanel>

              {mockCategories.map((category) => {
                const categoryManga = filteredAll.filter((manga) =>
                  category.mangaIds.includes(manga.mangaId)
                )
                return (
                  <TabPanel key={category.id} value={category.id}>
                    {categoryManga.length === 0 ? (
                      <EmptyState
                        message={
                          searchQuery
                            ? `Nothing in "${category.name}" matches that...`
                            : `Your "${category.name}" shelf is empty!`
                        }
                        isSearchResult={!!searchQuery}
                      />
                    ) : (
                      <MangaGrid
                        items={categoryManga}
                        onFavourite={handleRemoveFromLibrary}
                        onClick={handleMangaClick}
                      />
                    )}
                  </TabPanel>
                )
              })}
            </Tabs>
          ) : (
            // No categories - show all manga in a simple grid
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
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
