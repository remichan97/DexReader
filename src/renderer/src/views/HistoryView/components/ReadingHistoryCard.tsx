import type { JSX } from 'react'
import { History24Regular, PlayCircle24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { getLanguageName } from '@renderer/constants/language-list.constant'

// Type extracted from IPC response - includes metadata via JOINs
type MangaProgressMetadata = NonNullable<
  Awaited<ReturnType<typeof globalThis.progress.getAllProgress>>['data']
>[number]

interface ReadingHistoryCardProps {
  readonly progress: MangaProgressMetadata
  readonly onContinueReading: () => void
  readonly onRemove: () => void
}

/**
 * Format relative time from Unix timestamp
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp * 1000 // Convert from Unix timestamp to ms
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return new Date(timestamp * 1000).toLocaleDateString()
  } else if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else {
    return 'Just now'
  }
}

/**
 * Reading History Card Component
 *
 * Displays a manga reading history entry with cover image,
 * title, progress information, and action buttons.
 *
 * @example
 * ```tsx
 * <ReadingHistoryCard
 *   progress={progressData}
 *   onContinueReading={handleContinue}
 *   onRemove={handleRemove}
 * />
 * ```
 */
export function ReadingHistoryCard({
  progress,
  onContinueReading,
  onRemove
}: ReadingHistoryCardProps): JSX.Element {
  return (
    <div className="reading-history-card flex items-center gap-3">
      {/* Cover Image */}
      <div className="reading-history-card__cover">
        {progress.coverUrl ? (
          <img src={progress.coverUrl} alt={`${progress.title} cover`} />
        ) : (
          <div className="reading-history-card__cover-placeholder flex items-center justify-center">
            <History24Regular />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="reading-history-card__info">
        <h3 className="reading-history-card__title">{progress.title}</h3>
        <p className="reading-history-card__progress flex items-center gap-2 flex-wrap">
          Ch. {progress.lastChapterNumber || '?'}
          {progress.lastChapterTitle && `: ${progress.lastChapterTitle}`}
          {progress.language && (
            <span className="reading-history-card__language inline-flex items-center">
              {getLanguageName(progress.language)}
            </span>
          )}
        </p>
        <p className="reading-history-card__meta">
          Last read {getRelativeTime(progress.lastReadAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="reading-history-card__actions flex gap-2">
        <Button
          variant="primary"
          size="small"
          onClick={onContinueReading}
          icon={<PlayCircle24Regular />}
        >
          Continue
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={onRemove}
          icon={<Delete24Regular />}
          aria-label="Remove from history"
        >
          {''}
        </Button>
      </div>
    </div>
  )
}
