import type { JSX } from 'react'
import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { MangaCard } from '@renderer/components/MangaCard'
import { SearchBar } from '@renderer/components/SearchBar'
import { Badge } from '@renderer/components/Badge'
import { useToastStore } from '@renderer/stores'
import { BookQuestionMark24Regular, Search24Regular } from '@fluentui/react-icons'
import './LibraryView.css'

// Helper Components (moved outside parent to prevent re-renders)
interface EmptyStateProps {
  readonly message: string
  readonly isSearchResult?: boolean
}

const EmptyState = ({ message, isSearchResult = false }: EmptyStateProps): JSX.Element => (
  <div className="library__empty">
    {isSearchResult ? (
      <Search24Regular style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }} />
    ) : (
      <BookQuestionMark24Regular style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }} />
    )}
    <div>{message}</div>
  </div>
)

interface MangaGridProps {
  readonly items: Array<{
    readonly id: string
    readonly coverUrl: string
    readonly title: string
    readonly author: string
    readonly status: 'ongoing' | 'completed' | 'hiatus'
    readonly chaptersRead: number
    readonly totalChapters: number
  }>
  readonly onFavourite?: (id: string) => void
}

const MangaGrid = ({ items, onFavourite }: MangaGridProps): JSX.Element => (
  <div className="library__grid">
    {items.map((manga) => (
      <MangaCard
        key={manga.id}
        id={manga.id}
        coverUrl={manga.coverUrl}
        title={manga.title}
        author={manga.author}
        status={manga.status}
        chaptersRead={manga.chaptersRead}
        totalChapters={manga.totalChapters}
        isFavourite={true}
        showFavouriteBadge={false}
        onFavourite={onFavourite}
      />
    ))}
  </div>
)

// Mock data for demonstration
const mockAllManga = [
  {
    id: '1',
    coverUrl: 'https://picsum.photos/seed/manga1/300/450',
    title: 'One Piece',
    author: 'Oda Eiichiro',
    status: 'ongoing' as const,
    chaptersRead: 1050,
    totalChapters: 1100
  },
  {
    id: '3',
    coverUrl: 'https://picsum.photos/seed/manga3/300/450',
    title: 'Hunter × Hunter',
    author: 'Togashi Yoshihiro',
    status: 'hiatus' as const,
    chaptersRead: 350,
    totalChapters: 400
  },
  {
    id: '4',
    coverUrl: 'https://picsum.photos/seed/manga4/300/450',
    title: 'My Hero Academia',
    author: 'Horikoshi Kohei',
    status: 'ongoing' as const,
    chaptersRead: 120,
    totalChapters: 400
  },
  {
    id: '2',
    coverUrl: 'https://picsum.photos/seed/manga2/300/450',
    title: 'Attack on Titan',
    author: 'Hajime Isayama',
    status: 'completed' as const,
    chaptersRead: 139,
    totalChapters: 139
  },
  {
    id: '5',
    coverUrl: 'https://picsum.photos/seed/manga5/300/450',
    title: 'Demon Slayer',
    author: 'Gotouge Koyoharu',
    status: 'completed' as const,
    chaptersRead: 205,
    totalChapters: 205
  }
]

// Mock user categories - empty by default
const mockCategories: Array<{
  id: string
  name: string
  mangaIds: string[]
}> = []

export function LibraryView(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')

  // Zustand stores
  const show = useToastStore((state) => state.show)
  // Library store hooks ready for Phase 3:
  // const addBookmark = useLibraryStore((state) => state.addBookmark)
  // const removeBookmark = useLibraryStore((state) => state.removeBookmark)
  // const isBookmarked = useLibraryStore((state) => state.isBookmarked)

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
    console.log('Library search:', query)
  }

  const handleRemoveFromLibrary = (id: string): void => {
    const manga = mockAllManga.find((m) => m.id === id)
    console.log('Remove from library:', id, manga?.title)

    // Show toast notification
    show({
      title: 'Removed!',
      message: manga ? `${manga.title} is gone` : 'Manga removed',
      variant: 'info',
      duration: 3000
    })

    // NOTE: Actual remove from library functionality will be implemented in P1-T04
  }

  interface MangaItem {
    id: string
    coverUrl: string
    title: string
    author: string
    status: 'ongoing' | 'completed' | 'hiatus'
    chaptersRead: number
    totalChapters: number
  }

  const filterManga = (manga: MangaItem[]): MangaItem[] => {
    if (!searchQuery) return manga
    return manga.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const filteredAll = filterManga(mockAllManga)
  const hasCategories = mockCategories.length > 0

  return (
    <div style={{ padding: '24px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <SearchBar value={searchQuery} onChange={handleSearch} placeholder="Search your library" />
      </div>

      {/* Category Tabs - only shown when user has categories */}
      {hasCategories ? (
        <Tabs defaultValue="all">
          <TabList>
            <Tab value="all">
              All{' '}
              <Badge variant="default" size="small">
                {mockAllManga.length}
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
              <MangaGrid items={filteredAll} onFavourite={handleRemoveFromLibrary} />
            )}
          </TabPanel>

          {mockCategories.map((category) => {
            const categoryManga = filteredAll.filter((manga) =>
              category.mangaIds.includes(manga.id)
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
                  <MangaGrid items={categoryManga} onFavourite={handleRemoveFromLibrary} />
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
            <MangaGrid items={filteredAll} onFavourite={handleRemoveFromLibrary} />
          )}
        </>
      )}
    </div>
  )
}
