import type { JSX } from 'react'
import { useState } from 'react'
import { SearchBar } from '@renderer/components/SearchBar'
import { MangaCard } from '@renderer/components/MangaCard'
import { SkeletonGrid } from '@renderer/components/Skeleton'

// Mock data for demonstration
const mockManga = [
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
    id: '2',
    coverUrl: 'https://picsum.photos/seed/manga2/300/450',
    title: 'Attack on Titan',
    author: 'Hajime Isayama',
    status: 'completed' as const,
    chaptersRead: 139,
    totalChapters: 139
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
    status: 'ongoing' as const
  },
  {
    id: '5',
    coverUrl: 'https://picsum.photos/seed/manga5/300/450',
    title: 'Demon Slayer',
    author: 'Gotouge Koyoharu',
    status: 'completed' as const
  },
  {
    id: '6',
    coverUrl: 'https://picsum.photos/seed/manga6/300/450',
    title: 'Jujutsu Kaisen',
    author: 'Akutami Gege',
    status: 'ongoing' as const
  }
]

export function BrowseView(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCount] = useState(2)
  const [favourites, setFavourites] = useState<Set<string>>(new Set(['1', '3']))

  const handleSearch = (query: string): void => {
    console.log('Search query:', query)
    setSearchQuery(query)

    // Simulate API call
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  const handleMangaClick = (id: string): void => {
    console.log('Manga clicked:', id)
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
  }

  const handleFilterClick = (): void => {
    setShowFilters(!showFilters)
    console.log('Filter button clicked')
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          onFilterClick={handleFilterClick}
          filterCount={filterCount}
          placeholder="Search for manga"
        />
      </div>

      {/* Filter info */}
      {showFilters && (
        <div
          style={{
            padding: '16px',
            background: 'var(--win-bg-subtle)',
            border: '1px solid var(--win-border-default)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px'
          }}
        >
          <p>Filters panel would go here. Active filters: {filterCount}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && <SkeletonGrid count={6} />}

      {/* Manga Grid */}
      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}
        >
          {mockManga.map((manga) => (
            <MangaCard
              key={manga.id}
              id={manga.id}
              coverUrl={manga.coverUrl}
              title={manga.title}
              author={manga.author}
              status={manga.status}
              chaptersRead={manga.chaptersRead}
              totalChapters={manga.totalChapters}
              isFavourite={favourites.has(manga.id)}
              onClick={handleMangaClick}
              onFavourite={handleFavouriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
