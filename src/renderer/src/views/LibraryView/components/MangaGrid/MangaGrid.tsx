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
    readonly hasNewChapters?: boolean
  }>
  readonly onFavourite?: (id: string) => void
  readonly onClick?: (id: string) => void
  readonly onAddToCollection?: (id: string) => void
}

export function MangaGrid({
  items,
  onFavourite,
  onClick,
  onAddToCollection
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
                isFavourite={true}
                showFavouriteBadge={false}
                hasNewChapters={manga.hasNewChapters}
                onFavourite={onFavourite}
                onClick={onClick}
              />
            </div>
          }
          items={[
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
          ]}
        />
      ))}
    </div>
  )
}
