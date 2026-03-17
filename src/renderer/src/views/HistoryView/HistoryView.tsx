import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History24Regular, PlayCircle24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { EmptyState } from '@renderer/components/EmptyState'
import { LoadingState } from '@renderer/components/LoadingState'
import { useProgressStore } from '@renderer/stores/progressStore'
import { getLanguageName } from '@renderer/constants/language-list.constant'
import './HistoryView.css'

// Type extracted from IPC response - includes metadata via JOINs
type MangaProgressMetadata = NonNullable<
  Awaited<ReturnType<typeof globalThis.progress.getAllProgress>>['data']
>[number]

interface ReadingHistoryCardProps {
  readonly progress: MangaProgressMetadata
  readonly onContinueReading: () => void
  readonly onRemove: () => void
}

function ReadingHistoryCard({
  progress,
  onContinueReading,
  onRemove
}: ReadingHistoryCardProps): JSX.Element {
  // Format relative time
  const getRelativeTime = (timestamp: number): string => {
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

export function HistoryView(): JSX.Element {
  const navigate = useNavigate()
  const loadAllProgress = useProgressStore((state) => state.loadAllProgress)
  const loadStatistics = useProgressStore((state) => state.loadStatistics)
  const deleteProgress = useProgressStore((state) => state.deleteProgress)
  const progressMetadataMap = useProgressStore((state) => state.progressMetadataMap)
  const statistics = useProgressStore((state) => state.statistics)
  const loading = useProgressStore((state) => state.loading)

  const [searchQuery, setSearchQuery] = useState('')

  // Load all progress on mount
  useEffect(() => {
    loadAllProgress()
    loadStatistics()
  }, [loadAllProgress, loadStatistics])

  // Set document title
  useEffect(() => {
    document.title = 'Reading History - DexReader'
  }, [])

  // Convert progress metadata map to sorted array
  const allProgress = Array.from(progressMetadataMap.values()).sort(
    (a, b) => b.lastReadAt - a.lastReadAt
  )

  // Filter by search query
  const filteredProgress = searchQuery
    ? allProgress.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : allProgress

  const handleContinueReading = (progress: MangaProgressMetadata): void => {
    // Start from beginning of last chapter (current page tracking handled by reader)
    navigate(`/reader/${progress.mangaId}/${progress.lastChapterId}`, {
      state: {
        chapterNumber: progress.lastChapterNumber?.toString(),
        chapterTitle: progress.lastChapterTitle,
        mangaTitle: progress.title,
        startPage: 0
      }
    })
  }

  const handleRemove = async (mangaId: string): Promise<void> => {
    await deleteProgress(mangaId)
    // Reload statistics after deletion
    loadStatistics()
  }

  return (
    <div className="history-view flex flex-col">
      {/* Screen reader heading for page structure */}
      <h1 className="sr-only">Reading History</h1>

      {/* Statistics */}
      {statistics && (
        <div className="history-view__stats">
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalMangaRead}</span>
            <span className="stat-card__label">Manga Read</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalChaptersRead}</span>
            <span className="stat-card__label">Chapters</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalPagesRead}</span>
            <span className="stat-card__label">Pages</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalEstimatedMinutesRead}</span>
            <span className="stat-card__label">Minutes</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="history-view__search">
        <input
          type="search"
          placeholder="Search manga titles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="history-view__search-input"
        />
      </div>

      {/* History List */}
      <div className="history-view__content">
        {loading && <LoadingState message="Loading history..." />}

        {!loading && filteredProgress.length === 0 && !searchQuery && (
          <EmptyState
            icon={<History24Regular />}
            title="No reading history yet"
            message="Start reading manga to see your progress here."
            action={{
              label: 'Browse Manga',
              onClick: () => navigate('/browse'),
              variant: 'primary'
            }}
          />
        )}

        {!loading && filteredProgress.length === 0 && searchQuery && (
          <EmptyState message={`No results found for "${searchQuery}"`} variant="search" />
        )}

        {!loading && filteredProgress.length > 0 && (
          <div className="history-view__list flex flex-col gap-3">
            {filteredProgress.map((progress) => (
              <ReadingHistoryCard
                key={progress.mangaId}
                progress={progress}
                onContinueReading={() => handleContinueReading(progress)}
                onRemove={() => handleRemove(progress.mangaId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
