import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { forwardOrigin } from '@renderer/utils/navigationOrigin'
import { getResumePage } from '@renderer/utils/readingProgress'
import { useSecureNavigation } from '@renderer/hooks/useSecureNavigation'
import { Button } from '@renderer/components/Button'
import { EmptyState } from '@renderer/components/EmptyState'
import { Skeleton } from '@renderer/components/Skeleton'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { DownloadConfirmationDialog } from '@renderer/components/DownloadConfirmationDialog'
import { BookOpen48Regular } from '@fluentui/react-icons'
import { getMangaTitle } from '@renderer/utils/mangaHelpers'
import { getLanguageName } from '@renderer/constants/language-list.constant'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ChapterListHeader } from './ChapterListHeader'
import { ChapterListItem } from './ChapterListItem'
import { useChapterFilters } from './hooks/useChapterFilters'
import { useChapterDownloads } from './hooks/useChapterDownloads'
import type { MangaContract, ChapterContract } from '../../../../../../preload/window.types'

type MangaEntity = MangaContract
type ChapterEntity = ChapterContract

interface ChapterListProps {
  readonly mangaId: string
  /** Route that opened the detail page; forwarded to the reader so it can return there */
  readonly origin?: string
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
  /** False while later pages of a long series are still loading, or after one failed */
  readonly chaptersComplete: boolean
  /** How many chapters the API says the series has in this language */
  readonly chaptersTotal: number
  /** Which end of the series arrived first, so the missing chapters are at the other end */
  readonly chaptersLoadedFrom: 'oldest' | 'newest' | undefined
  /** A later page failed, so the list is partial until retried */
  readonly chaptersLoadFailed: boolean
  /** The language the feed is filtered to; undefined when it holds every language */
  readonly chaptersFilterLanguage: string | undefined
}

/**
 * Chapter list component with filtering, sorting, and download functionality.
 * Refactored into smaller components for better maintainability.
 */
export default function ChapterList({
  mangaId,
  origin,
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
  onToggleErrorDetails,
  chaptersComplete,
  chaptersTotal,
  chaptersLoadedFrom,
  chaptersLoadFailed,
  chaptersFilterLanguage
}: ChapterListProps): JSX.Element {
  const navigate = useNavigate()
  const { secureNavigate } = useSecureNavigation()
  const { t } = useTranslation(['mangaDetail', 'common'])

  // Use custom hooks for filters and downloads
  const { availableLanguages, displayChapters, readingOrderChapters } = useChapterFilters({
    manga,
    chapters,
    sortOrder
  })

  // While a long series is still loading, the chapters that haven't arrived belong at one end of
  // the list: the older ones if the newest came first, the newer ones otherwise. Which edge of the
  // screen that is depends on the display order.
  const missingChapters = chaptersLoadedFrom === 'newest' ? 'older' : 'newer'
  const missingAtBottom = (chaptersLoadedFrom === 'newest') === (sortOrder === 'desc')
  const showLoadingRow = !loading && !error && !chaptersComplete && displayChapters.length > 0

  const loadingRow = (
    <div className="chapter-list-loading-more flex items-center gap-3" role="status">
      {chaptersLoadFailed ? (
        <>
          <span>{t('mangaDetail:chapters.loadFailed')}</span>
          <Button variant="secondary" size="small" onClick={onRetry}>
            {t('common:button.retry')}
          </Button>
        </>
      ) : (
        <>
          <ProgressRing size="small" />
          <span>
            {t(
              missingChapters === 'older'
                ? 'mangaDetail:chapters.loadingOlder'
                : 'mangaDetail:chapters.loadingNewer',
              { loaded: chapters.length, total: chaptersTotal }
            )}
          </span>
        </>
      )}
    </div>
  )

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
        // Download all always queues in reading order, oldest first, whatever order is displayed
        onDownloadAllClick={() => handleDownloadAllClick(readingOrderChapters)}
        downloadAllEnabled={!!downloadSettings}
        downloadAllWaitingForChapters={!chaptersComplete}
        totalChapters={chaptersComplete ? undefined : chaptersTotal}
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
            <p className="error-message">{t('mangaDetail:chapterError.title')}</p>
            <p className="error-hint">{t('mangaDetail:chapterError.message')}</p>
            <div className="error-actions flex gap-2">
              <Button variant="secondary" onClick={onRetry}>
                {t('common:button.tryAgain')}
              </Button>
              <Button variant="ghost" onClick={onToggleErrorDetails}>
                {showErrorDetails ? t('common:action.hide') : t('common:action.show')}{' '}
                {t('common:label.technicalDetails')}
              </Button>
            </div>
            {showErrorDetails && error && (
              <div className="error-technical-details">
                <div>
                  <strong>{t('common:label.error')}</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mt-2">
                    <strong>{t('common:label.stackTrace')}</strong>
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
            message={t('mangaDetail:chapterError.noChaptersInLanguage', {
              language: getLanguageName(selectedLanguage),
              code: selectedLanguage.toUpperCase(),
              defaultValue: `No chapters available in ${getLanguageName(selectedLanguage)} (${selectedLanguage.toUpperCase()})`
            })}
            action={{
              label: t('mangaDetail:chapterError.viewOnMangaDex', {
                defaultValue: 'View on MangaDex'
              }),
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

        {showLoadingRow && !missingAtBottom && loadingRow}

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
              ? { currentPage: chapterProg.currentPage, totalPages: chapter.pages }
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
                      chapterNumber: chapter.chapter,
                      chapterTitle: chapter.title,
                      mangaTitle: manga ? getMangaTitle(manga) : 'Manga',
                      chapters: chapters, // Pass the chapter list (oldest first) for navigation
                      // A list still loading is finished by the reader, in the same language
                      chaptersComplete,
                      chapterLanguage: chaptersFilterLanguage,
                      coverUrl: manga ? (manga.coverUrlLarge ?? manga.coverUrl) : undefined,
                      startPage: getResumePage(chapterProg), // Reopen where it was left off
                      ...forwardOrigin(origin)
                    }
                  })
                }
              />
            )
          })}

        {showLoadingRow && missingAtBottom && loadingRow}
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
          chapterTitle={selectedChapter.title || 'Untitled'}
          defaultQuality={downloadSettings.defaultQuality}
          downloadsPath={downloadSettings.path}
          showBatchInfo={false}
          onOpenSettings={() => void secureNavigate('/settings')}
        />
      )}

      {/* Download All confirmation dialog */}
      {downloadSettings && (
        <DownloadConfirmationDialog
          isOpen={showDownloadAllDialog}
          onClose={() => setShowDownloadAllDialog(false)}
          onConfirm={(quality) => handleDownloadAll(readingOrderChapters, quality)}
          chapterCount={readingOrderChapters.length}
          chapterTitle=""
          defaultQuality={downloadSettings.defaultQuality}
          downloadsPath={downloadSettings.path}
          showBatchInfo={true}
          onOpenSettings={() => void secureNavigate('/settings')}
        />
      )}
    </div>
  )
}
