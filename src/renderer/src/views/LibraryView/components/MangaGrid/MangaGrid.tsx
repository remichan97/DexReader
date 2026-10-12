import type { JSX } from 'react'
import { MangaCard } from '@renderer/components/MangaCard'

interface MangaGridProps {
  readonly items: Array<{
    readonly mangaId: string
    readonly coverUrl?: string
    readonly title: string
    readonly authors: string[]
    readonly status: string
    readonly lastChapter?: string
    readonly isFavourite?: boolean // Track favorite status
    readonly hasDownloads?: boolean // Track download availability
  }>
  readonly onFavourite?: (id: string) => void
  readonly onClick?: (id: string) => void
  readonly onAddToCollection?: (id: string) => void
  readonly onAddToLibrary?: (id: string) => void // For non-favorited downloads
  readonly hasCollections?: boolean
}

export function MangaGrid({
  items,
  onFavourite,
  onClick,
  onAddToCollection,
  onAddToLibrary,
  hasCollections = false
}: MangaGridProps): JSX.Element {
  return (
    <div className="library__grid">
      {items.map((manga) => (
        <MangaCard
          key={manga.mangaId}
          id={manga.mangaId}
          coverUrl={manga.coverUrl || ''}
          title={manga.title}
          author={manga.authors[0] || 'Unknown'}
          status={manga.status as 'ongoing' | 'completed' | 'hiatus'}
          isFavourite={manga.isFavourite ?? true} // Default to true for backward compat
          showFavouriteBadge={manga.isFavourite ?? true}
          showDownloadBadge={!manga.isFavourite} // Show download badge for non-favorited
          hasDownloads={manga.hasDownloads ?? false} // Show overlay for all with downloads
          onFavourite={(manga.isFavourite ?? true) ? onFavourite : onAddToLibrary}
          onClick={onClick}
          onAddToCollection={onAddToCollection}
          hasCollections={hasCollections}
        />
      ))}
    </div>
  )
}
