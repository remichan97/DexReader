import type { JSX } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/Button'
import { Select } from '@renderer/components/Select'
import { Skeleton } from '@renderer/components/Skeleton'
import { getCoverImageUrl, getMangaTitle, CoverSize } from '@renderer/utils/mangaHelpers'
import { getLanguageName } from '@renderer/constants/language-list.constant'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface ChapterListProps {
  readonly mangaId: string
  readonly manga: MangaEntity
  readonly chapters: ChapterEntity[]
  readonly selectedLanguage: string
  readonly sortOrder: 'asc' | 'desc'
  readonly loading: boolean
  readonly error: Error | null
  readonly showErrorDetails: boolean
  readonly progress: NonNullable<
    Awaited<ReturnType<Window['progress']['getProgress']>>['data']
  > | null
  readonly onLanguageChange: (lang: string) => void
  readonly onSortChange: (order: 'asc' | 'desc') => void
  readonly onRetry: () => void
  readonly onToggleErrorDetails: () => void
}

/**
 * Chapter list with filtering and sorting
 */
export default function ChapterList({
  mangaId,
  manga,
  chapters,
  selectedLanguage,
  sortOrder,
  loading,
  error,
  showErrorDetails,
  progress,
  onLanguageChange,
  onSortChange,
  onRetry,
  onToggleErrorDetails
}: ChapterListProps): JSX.Element {
  const navigate = useNavigate()

  // Get available languages from manga attributes
  const availableLanguages = useMemo(() => {
    const langs =
      (manga.attributes as { availableTranslatedLanguages?: string[] })
        .availableTranslatedLanguages || []
    return langs.sort((a, b) => a.localeCompare(b))
  }, [manga])

  // Filter and sort chapters
  const displayChapters = useMemo(() => {
    // Chapters are already filtered by language from API
    const filtered = [...chapters]

    // Sort by chapter number
    filtered.sort((a, b) => {
      const aNum = Number.parseFloat(a.attributes.chapter || '0')
      const bNum = Number.parseFloat(b.attributes.chapter || '0')
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
    })

    return filtered
  }, [chapters, sortOrder])

  return (
    <div className="manga-detail-view__chapters">
      {/* Header with controls */}
      <div className="chapter-list-header">
        <h2 className="section-title">Chapters ({displayChapters.length})</h2>

        <div className="chapter-controls">
          {/* Language filter */}
          {availableLanguages.length > 1 && (
            <Select
              value={selectedLanguage}
              onChange={(val) => onLanguageChange(val as string)}
              options={availableLanguages.map((lang) => ({
                value: lang,
                label: `${getLanguageName(lang)} (${lang.toUpperCase()})`
              }))}
              aria-label="Select chapter language"
            />
          )}

          {/* Sort order */}
          <Select
            value={sortOrder}
            onChange={(val) => onSortChange(val as 'asc' | 'desc')}
            options={[
              { value: 'asc', label: 'Oldest First' },
              { value: 'desc', label: 'Newest First' }
            ]}
            aria-label="Sort chapters"
          />
        </div>
      </div>

      {/* Chapter items */}
      <div className="chapter-list-items">
        {loading && (
          <div className="chapter-list-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`chapter-loading-${i}`} width="100%" height={56} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="chapter-list-error">
            <p className="error-message">Couldn&apos;t load chapters for this language</p>
            <p className="error-hint">Try refreshing or picking a different language.</p>
            <div className="error-actions">
              <Button variant="secondary" onClick={onRetry}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={onToggleErrorDetails}>
                {showErrorDetails ? 'Hide' : 'Show'} technical details
              </Button>
            </div>
            {showErrorDetails && error && (
              <div className="error-technical-details">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: '1.4' }}>
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !error && displayChapters.length === 0 && (
          <div className="chapter-list-empty">
            <p>
              No chapters available in {getLanguageName(selectedLanguage)} (
              {selectedLanguage.toUpperCase()})
            </p>
            <p className="chapter-list-empty-hint">
              Chapters may have been removed by translators or are currently unavailable.
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                window.open(
                  `https://mangadex.org/title/${mangaId}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              View on MangaDex
            </Button>
          </div>
        )}

        {!loading &&
          !error &&
          displayChapters.length > 0 &&
          displayChapters.map((chapter) => {
            // Check if this chapter is in progress (currently reading)
            const isInProgress = progress?.lastChapterId === chapter.id

            // TODO: Fetch chapter progress separately via getAllChapterProgress
            // For now, only show in-progress indicator
            const isRead = false
            const pageProgress = undefined // Will be populated when chapter progress is fetched

            return (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isRead={isRead}
                isInProgress={isInProgress}
                pageProgress={pageProgress}
                onClick={() =>
                  navigate(`/reader/${mangaId}/${chapter.id}`, {
                    state: {
                      chapterNumber: chapter.attributes.chapter,
                      chapterTitle: chapter.attributes.title,
                      mangaTitle: manga ? getMangaTitle(manga) : 'Manga',
                      chapters: chapters, // Pass full chapter list for navigation
                      coverUrl: manga ? getCoverImageUrl(manga, CoverSize.Large) : undefined
                    }
                  })
                }
              />
            )
          })}
      </div>
    </div>
  )
}

/**
 * Individual chapter item
 */
interface ChapterItemProps {
  readonly chapter: ChapterEntity
  readonly onClick: () => void
  readonly isRead?: boolean
  readonly isInProgress?: boolean
  readonly pageProgress?: { currentPage: number; totalPages: number }
}

function ChapterItem({
  chapter,
  onClick,
  isRead,
  isInProgress,
  pageProgress
}: ChapterItemProps): JSX.Element {
  const chapterNum = chapter.attributes.chapter || '0'
  const title = chapter.attributes.title || 'Untitled'
  const publishDate = new Date(chapter.attributes.publishAt).toLocaleDateString()

  // Get scanlation group name
  const scanlationGroup = chapter.relationships.find((r) => r.type === 'scanlation_group')
  const groupName = scanlationGroup?.attributes?.name || 'Unknown Group'

  // Determine status classes
  let statusClass = ''
  if (isInProgress) {
    statusClass = 'chapter-item--in-progress'
  } else if (isRead) {
    statusClass = 'chapter-item--read'
  }

  return (
    <Button
      variant="ghost"
      className={`chapter-item ${statusClass}`}
      onClick={onClick}
      aria-label={`Read Chapter ${chapterNum}: ${title}`}
    >
      <div className="chapter-item__content">
        <div className="chapter-item__main">
          <span className="chapter-item__number">Ch. {chapterNum}</span>
          <div className="chapter-item__info">
            {title && <span className="chapter-item__title">{title}</span>}
            <span className="chapter-item__group">{groupName}</span>
          </div>
        </div>

        <div className="chapter-item__meta">
          {pageProgress && (
            <span className="chapter-item__progress">
              p. {pageProgress.currentPage + 1}/{pageProgress.totalPages}
            </span>
          )}
          <span className="chapter-item__date">{publishDate}</span>
        </div>
      </div>
    </Button>
  )
}
