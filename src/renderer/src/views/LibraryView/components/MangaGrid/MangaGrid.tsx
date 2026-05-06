import type { JSX } from 'react'
import { MangaCard } from '@renderer/components/MangaCard'
import { ContextMenu } from '@renderer/components/ContextMenu'

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
}

export function MangaGrid({
  items,
  onFavourite,
  onClick,
  onAddToCollection,
  onAddToLibrary
}: MangaGridProps): JSX.Element {
  return (
    <div className="library__grid">
      {items.map((manga) => (
        <ContextMenu
          key={manga.mangaId}
          trigger={
            <div>
              <MangaCard
                id={manga.mangaId}
                coverUrl={manga.coverUrl || ''}
                title={manga.title}
                author={manga.authors[0] || 'Unknown'}
                status={manga.status as 'ongoing' | 'completed' | 'hiatus'}
                isFavourite={manga.isFavourite ?? true} // Default to true for backward compat
                showFavouriteBadge={manga.isFavourite ?? true}
                showDownloadBadge={!manga.isFavourite} // Show download badge for non-favorited
                hasDownloads={manga.hasDownloads ?? false} // Show overlay for all with downloads
                onFavourite={onFavourite}
                onClick={onClick}
              />
            </div>
          }
          items={
            (manga.isFavourite ?? true)
              ? [
                  // Favorited manga
                  {
                    label: 'Go to Detail',
                    onClick: () => onClick?.(manga.mangaId)
                  },
                  { type: 'separator' },
                  {
                    label: 'Add to Collection...',
                    onClick: () => onAddToCollection?.(manga.mangaId)
                  },
                  { type: 'separator' },
                  {
                    label: 'Remove from Library',
                    onClick: () => onFavourite?.(manga.mangaId)
                  }
                ]
              : [
                  // Non-favorited downloaded manga
                  {
                    label: 'Go to Detail',
                    onClick: () => onClick?.(manga.mangaId)
                  },
                  { type: 'separator' },
                  {
                    label: 'Add to Library',
                    onClick: () => onAddToLibrary?.(manga.mangaId)
                  }
                ]
          }
        />
      ))}
    </div>
  )
}
