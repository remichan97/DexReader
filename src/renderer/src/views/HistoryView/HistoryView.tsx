import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History24Regular } from '@fluentui/react-icons'
import { EmptyState } from '@renderer/components/EmptyState'
import { LoadingState } from '@renderer/components/LoadingState'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useProgressStore } from '@renderer/stores/progressStore'
import { ReadingHistoryCard } from './components/ReadingHistoryCard'
import './HistoryView.css'

// Type extracted from IPC response - includes metadata via JOINs
type MangaProgressMetadata = NonNullable<
  Awaited<ReturnType<typeof globalThis.progress.getAllProgress>>['data']
>[number]

export function HistoryView(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['history', 'common'])
  const loadAllProgress = useProgressStore((state) => state.loadAllProgress)
  const loadStatistics = useProgressStore((state) => state.loadStatistics)
  const deleteProgress = useProgressStore((state) => state.deleteProgress)
  const progressMetadataMap = useProgressStore((state) => state.progressMetadataMap)
  const statistics = useProgressStore((state) => state.statistics)
  const loading = useProgressStore((state) => state.loading)

  const [searchQuery, setSearchQuery] = useState('')

  // Load all progress on mount
  useEffect(() => {
    // Always refresh data, but progressStore won't show loading if cache exists
    loadAllProgress()
    loadStatistics()
  }, [loadAllProgress, loadStatistics])

  // Set document title
  useEffect(() => {
    document.title = t('history:documentTitle')
  }, [t])

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
      <h1 className="sr-only">{t('history:pageTitle')}</h1>

      {/* Statistics */}
      {statistics && (
        <div className="history-view__stats">
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalMangaRead}</span>
            <span className="stat-card__label">{t('history:stats.mangaRead')}</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalChaptersRead}</span>
            <span className="stat-card__label">{t('history:stats.chapters')}</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalPagesRead}</span>
            <span className="stat-card__label">{t('history:stats.pages')}</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalEstimatedMinutesRead}</span>
            <span className="stat-card__label">{t('history:stats.minutes')}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="history-view__search">
        <input
          type="search"
          placeholder={t('history:searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="history-view__search-input"
        />
      </div>

      {/* History List */}
      <div className="history-view__content">
        {loading && <LoadingState message={t('history:loadingState.message')} />}

        {!loading && filteredProgress.length === 0 && !searchQuery && (
          <EmptyState
            icon={<History24Regular />}
            title={t('history:emptyState.title')}
            message={t('history:emptyState.message')}
            action={{
              label: t('history:emptyState.action'),
              onClick: () => navigate('/browse'),
              variant: 'primary'
            }}
          />
        )}

        {!loading && filteredProgress.length === 0 && searchQuery && (
          <EmptyState message={t('history:searchEmpty', { query: searchQuery })} variant="search" />
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
