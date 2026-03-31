import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/Button'
import { EmptyState } from '@renderer/components/EmptyState'
import { Skeleton } from '@renderer/components/Skeleton'
import { DownloadConfirmationDialog } from '@renderer/components/DownloadConfirmationDialog'
import { BookOpen48Regular } from '@fluentui/react-icons'
import { getCoverImageUrl, getMangaTitle, CoverSize } from '@renderer/utils/mangaHelpers'
import { getLanguageName } from '@renderer/constants/language-list.constant'
import { ChapterListHeader } from './ChapterListHeader'
import { ChapterListItem } from './ChapterListItem'
import { useChapterFilters } from './hooks/useChapterFilters'
import { useChapterDownloads } from './hooks/useChapterDownloads'

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
  readonly chapterProgress: Map<
    string,
    NonNullable<Awaited<ReturnType<Window['progress']['getAllChapterProgress']>>['data']>[number]
  >
  readonly onLanguageChange: (lang: string) => void
  readonly onSortChange: (order: 'asc' | 'desc') => void
  readonly onRetry: () => void
  readonly onToggleErrorDetails: () => void
}

/**
 * Chapter list component with filtering, sorting, and download functionality.
 * Refactored into smaller components for better maintainability.
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
  chapterProgress,
  onLanguageChange,
  onSortChange,
  onRetry,
  onToggleErrorDetails
}: ChapterListProps): JSX.Element {
  const navigate = useNavigate()

  // Use custom hooks for filters and downloads
  const { availableLanguages, displayChapters } = useChapterFilters({
    manga,
    chapters,
    sortOrder
  })

  const {
    downloadSettings,
    downloadStatusMap,
    showDownloadDialog,
    showDownloadAllDialog,
    selectedChapter,
    isOnline,
    setShowDownloadDialog,
    setShowDownloadAllDialog,
    setSelectedChapter,
    handleDownloadClick,
    handleDownloadAllClick,
    handleDownloadConfirm,
    handleDownloadAll
  } = useChapterDownloads({
    chapters,
    mangaId,
    selectedLanguage
  })

  return (
    <div className="manga-detail-view__chapters">
      {/* Header with controls */}
      <ChapterListHeader
        chapterCount={displayChapters.length}
        availableLanguages={availableLanguages}
        selectedLanguage={selectedLanguage}
        sortOrder={sortOrder}
        onLanguageChange={onLanguageChange}
        onSortChange={onSortChange}
        onDownloadAllClick={() => handleDownloadAllClick(displayChapters)}
        downloadAllEnabled={!!downloadSettings}
        isOnline={isOnline}
      />

      {/* Chapter items */}
      <div className="chapter-list-items flex flex-col">
        {/* Loading state */}
        {loading && (
          <div className="chapter-list-loading flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`chapter-loading-${i}`} width="100%" height={56} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="chapter-list-error flex flex-col items-center gap-3">
            <p className="error-message">Couldn&apos;t load chapters for this language</p>
            <p className="error-hint">Try refreshing or picking a different language.</p>
            <div className="error-actions flex gap-2">
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
                  <div className="mt-2">
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

        {/* Empty state */}
        {!loading && !error && displayChapters.length === 0 && (
          <EmptyState
            icon={<BookOpen48Regular />}
            message={`No chapters available in ${getLanguageName(selectedLanguage)} (${selectedLanguage.toUpperCase()})`}
            action={{
              label: 'View on MangaDex',
              onClick: () =>
                window.open(
                  `https://mangadex.org/title/${mangaId}`,
                  '_blank',
                  'noopener,noreferrer'
                ),
              variant: 'secondary'
            }}
          />
        )}

        {/* Chapter list */}
        {!loading &&
          !error &&
          displayChapters.length > 0 &&
          displayChapters.map((chapter) => {
            // Check if this chapter is in progress (currently reading)
            const isInProgress = progress?.lastChapterId === chapter.id

            // Get chapter progress from map
            const chapterProg = chapterProgress.get(chapter.id)
            const isRead = chapterProg?.completed ?? false
            const pageProgress = chapterProg
              ? { currentPage: chapterProg.currentPage, totalPages: chapter.attributes.pages }
              : undefined

            // Get download status from map
            const downloadStatus = downloadStatusMap.get(chapter.id) || 'not-downloaded'

            return (
              <ChapterListItem
                key={chapter.id}
                chapter={chapter}
                isRead={isRead}
                isInProgress={isInProgress}
                pageProgress={pageProgress}
                downloadStatus={downloadStatus}
                isOnline={isOnline}
                onDownloadClick={() => handleDownloadClick(chapter)}
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

      {/* Download confirmation dialog */}
      {selectedChapter && downloadSettings && (
        <DownloadConfirmationDialog
          isOpen={showDownloadDialog}
          onClose={() => {
            setShowDownloadDialog(false)
            setSelectedChapter(null)
          }}
          onConfirm={handleDownloadConfirm}
          chapterCount={1}
          chapterTitle={selectedChapter.attributes.title || 'Untitled'}
          defaultQuality={downloadSettings.defaultQuality}
          downloadsPath={downloadSettings.path}
          showBatchInfo={false}
          onOpenSettings={() => navigate('/settings')}
        />
      )}

      {/* Download All confirmation dialog */}
      {downloadSettings && (
        <DownloadConfirmationDialog
          isOpen={showDownloadAllDialog}
          onClose={() => setShowDownloadAllDialog(false)}
          onConfirm={(quality) => handleDownloadAll(displayChapters, quality)}
          chapterCount={displayChapters.length}
          chapterTitle=""
          defaultQuality={downloadSettings.defaultQuality}
          downloadsPath={downloadSettings.path}
          showBatchInfo={true}
          onOpenSettings={() => navigate('/settings')}
        />
      )}
    </div>
  )
}
