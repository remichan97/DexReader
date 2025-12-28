import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History24Regular, PlayCircle24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { useProgressStore } from '@renderer/stores/progressStore'
import './HistoryView.css'

// Type extracted from IPC response - includes metadata via JOINs
type MangaProgressMetadata = NonNullable<
  Awaited<ReturnType<typeof window.progress.getAllProgress>>['data']
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
    <div className="reading-history-card">
      {/* Cover Image */}
      <div className="reading-history-card__cover">
        {progress.coverUrl ? (
          <img src={progress.coverUrl} alt={`${progress.title} cover`} />
        ) : (
          <div className="reading-history-card__cover-placeholder">
            <History24Regular />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="reading-history-card__info">
        <h3 className="reading-history-card__title">{progress.title}</h3>
        <p className="reading-history-card__progress">
          Ch. {progress.lastChapterNumber || '?'}
          {progress.lastChapterTitle && `: ${progress.lastChapterTitle}`}
        </p>
        <p className="reading-history-card__meta">
          Last read {getRelativeTime(progress.lastReadAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="reading-history-card__actions">
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
    <div className="history-view">
      {/* Statistics */}
      {statistics && (
        <div className="history-view__stats">
          <div className="stat-card">
            <span className="stat-card__value">{statistics.totalMangaRead}</span>
            <span className="stat-card__label">Manga Read</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{statistics.totalChaptersRead}</span>
            <span className="stat-card__label">Chapters</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{statistics.totalPagesRead}</span>
            <span className="stat-card__label">Pages</span>
          </div>
          <div className="stat-card">
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
        {loading && (
          <div className="history-view__loading">
            <ProgressRing size="large" />
            <p>Loading history...</p>
          </div>
        )}

        {!loading && filteredProgress.length === 0 && !searchQuery && (
          <div className="history-view__empty">
            <History24Regular />
            <h2>No reading history yet</h2>
            <p>Start reading manga to see your progress here.</p>
            <Button variant="primary" onClick={() => navigate('/browse')}>
              Browse Manga
            </Button>
          </div>
        )}

        {!loading && filteredProgress.length === 0 && searchQuery && (
          <div className="history-view__empty">
            <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}

        {!loading && filteredProgress.length > 0 && (
          <div className="history-view__list">
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
