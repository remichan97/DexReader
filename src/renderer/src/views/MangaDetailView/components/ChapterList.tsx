import type { JSX } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/Button'
import { Select } from '@renderer/components/Select'
import { Skeleton } from '@renderer/components/Skeleton'
import { DownloadStatusBadge } from '@renderer/components/DownloadStatusBadge'
import type { DownloadStatus } from '@renderer/components/DownloadStatusBadge'
import { DownloadConfirmationDialog } from '@renderer/components/DownloadConfirmationDialog'
import { useToast } from '@renderer/components/Toast'
import { ArrowDownload20Regular } from '@fluentui/react-icons'
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
  chapterProgress,
  onLanguageChange,
  onSortChange,
  onRetry,
  onToggleErrorDetails
}: ChapterListProps): JSX.Element {
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  // Download dialog state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [showDownloadAllDialog, setShowDownloadAllDialog] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<ChapterEntity | null>(null)

  // Settings state
  const [downloadSettings, setDownloadSettings] = useState<{
    path: string
    defaultQuality: 'data' | 'data-saver'
    confirmation: 'always' | 'batch-only' | 'never'
  } | null>(null)

  // Download status cache
  const [downloadStatusMap, setDownloadStatusMap] = useState<Map<string, DownloadStatus>>(new Map())

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      const [pathResult, qualityResult, confirmationResult] = await Promise.all([
        globalThis.settings.getSettingByPath('downloads', 'downloadPath'),
        globalThis.settings.getSettingByPath('downloads', 'defaultQuality'),
        globalThis.settings.getSettingByPath('downloads', 'shouldConfirmDownload')
      ])

      if (pathResult.success && qualityResult.success && confirmationResult.success) {
        setDownloadSettings({
          path: String(pathResult.data),
          defaultQuality: qualityResult.data as 'data' | 'data-saver',
          confirmation: confirmationResult.data as 'always' | 'batch-only' | 'never'
        })
      }
    }

    void loadSettings()
  }, [])

  // Load download statuses for visible chapters
  useEffect(() => {
    async function loadDownloadStatuses(): Promise<void> {
      const statusMap = new Map<string, DownloadStatus>()

      // Check each chapter's download status
      await Promise.all(
        chapters.map(async (chapter) => {
          const result = await globalThis.downloads.getDownload(chapter.id)
          if (result.success && result.data) {
            // Map backend status to frontend status
            const backendStatus = result.data.status
            let frontendStatus: DownloadStatus = 'not-downloaded'
            switch (backendStatus) {
              case 'completed':
                frontendStatus = 'downloaded'
                break
              case 'queued':
                frontendStatus = 'queued'
                break
              case 'downloading':
                frontendStatus = 'downloading'
                break
              case 'failed':
                frontendStatus = 'failed'
                break
            }
            statusMap.set(chapter.id, frontendStatus)
          } else {
            statusMap.set(chapter.id, 'not-downloaded')
          }
        })
      )

      setDownloadStatusMap(statusMap)
    }

    if (chapters.length > 0) {
      void loadDownloadStatuses()
    }
  }, [chapters])

  // Listen to download progress events
  useEffect(() => {
    const unsubscribe = globalThis.api.onDownloadProgress((event) => {
      // Map backend status to frontend status
      let frontendStatus: DownloadStatus = 'not-downloaded'
      switch (event.status) {
        case 'completed':
          frontendStatus = 'downloaded'
          break
        case 'queued':
          frontendStatus = 'queued'
          break
        case 'downloading':
          frontendStatus = 'downloading'
          break
        case 'failed':
          frontendStatus = 'failed'
          break
      }

      // Update the status map for this chapter
      setDownloadStatusMap((prev) => new Map(prev).set(event.chapterId, frontendStatus))
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Get available languages from manga attributes
  const availableLanguages = useMemo(() => {
    const langs =
      (manga.attributes as { availableTranslatedLanguages?: string[] })
        .availableTranslatedLanguages || []
    return langs.sort((a, b) => a.localeCompare(b))
  }, [manga])

  // Filter and sort chapters
  const displayChapters = useMemo(() => {
    // Filter out unavailable chapters
    const filtered = chapters.filter(
      (chapter) => !(chapter.attributes as { isUnavailable?: boolean }).isUnavailable
    )

    // Remove duplicates by chapter ID (shouldn't happen but ensures unique keys)
    const uniqueChapters = Array.from(
      new Map(filtered.map((chapter) => [chapter.id, chapter])).values()
    )

    // Sort by chapter number
    uniqueChapters.sort((a, b) => {
      const aNum = Number.parseFloat(a.attributes.chapter || '0')
      const bNum = Number.parseFloat(b.attributes.chapter || '0')
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
    })

    return uniqueChapters
  }, [chapters, sortOrder])

  // Handle download button click
  const handleDownloadClick = async (chapter: ChapterEntity): Promise<void> => {
    if (!downloadSettings) return

    setSelectedChapter(chapter)

    // Check confirmation setting
    if (downloadSettings.confirmation === 'never') {
      // Download immediately with default quality
      await performDownload(chapter, downloadSettings.defaultQuality)
    } else if (downloadSettings.confirmation === 'batch-only') {
      // For single chapter, download directly
      await performDownload(chapter, downloadSettings.defaultQuality)
    } else {
      // 'always': show dialog
      setShowDownloadDialog(true)
    }
  }

  // Helper function to perform download
  const performDownload = async (
    chapter: ChapterEntity,
    quality: 'data' | 'data-saver'
  ): Promise<void> => {
    const result = await globalThis.downloads.addToQueue({
      chapterId: chapter.id,
      mangaId: mangaId,
      language: selectedLanguage,
      quality: quality,
      addedAt: new Date()
    })

    if (result.success) {
      setDownloadStatusMap((prev) => new Map(prev).set(chapter.id, 'queued'))
    } else {
      console.error('Failed to add chapter to queue:', result.error)
      // TODO: Show error toast/notification
    }
  }

  // Handle download confirmation from dialog
  const handleDownloadConfirm = async (quality: 'data' | 'data-saver'): Promise<void> => {
    if (!selectedChapter) return

    await performDownload(selectedChapter, quality)
    setShowDownloadDialog(false)
    setSelectedChapter(null)
  }

  // Handle Download All Chapters
  const handleDownloadAll = async (quality?: 'data' | 'data-saver'): Promise<void> => {
    if (!downloadSettings || displayChapters.length === 0) return

    const selectedQuality = quality || downloadSettings.defaultQuality

    // Queue all visible chapters for download
    const results = await Promise.all(
      displayChapters.map((chapter) =>
        globalThis.downloads.addToQueue({
          chapterId: chapter.id,
          mangaId: mangaId,
          language: selectedLanguage,
          quality: selectedQuality,
          addedAt: new Date()
        })
      )
    )

    const successCount = results.filter((r) => r.success).length
    const failCount = displayChapters.length - successCount

    if (successCount > 0) {
      showToast({
        title: 'Download Started',
        message: `Queued ${successCount} chapter${successCount === 1 ? '' : 's'} for download`,
        variant: 'success',
        duration: 3000
      })

      // Update status map for queued chapters
      const newStatusMap = new Map(downloadStatusMap)
      displayChapters.forEach((chapter) => {
        newStatusMap.set(chapter.id, 'queued')
      })
      setDownloadStatusMap(newStatusMap)
    }

    if (failCount > 0) {
      showToast({
        title: 'Partial Failure',
        message: `Failed to queue ${failCount} chapter${failCount === 1 ? '' : 's'}`,
        variant: 'error',
        duration: 5000
      })
    }

    setShowDownloadAllDialog(false)
  }

  // Handle Download All button click
  const handleDownloadAllClick = async (): Promise<void> => {
    if (!downloadSettings || displayChapters.length === 0) return

    // Check confirmation setting
    if (downloadSettings.confirmation === 'never') {
      // Download immediately with default quality
      await handleDownloadAll()
    } else if (
      downloadSettings.confirmation === 'batch-only' ||
      downloadSettings.confirmation === 'always'
    ) {
      // Show dialog for batch download
      setShowDownloadAllDialog(true)
    }
  }

  return (
    <div className="manga-detail-view__chapters">
      {/* Header with controls */}
      <div className="chapter-list-header">
        <h2 className="section-title">Chapters ({displayChapters.length})</h2>

        <div className="chapter-controls">
          {/* Download All button */}
          {displayChapters.length > 0 && downloadSettings && (
            <Button
              variant="secondary"
              size="small"
              onClick={handleDownloadAllClick}
              disabled={!downloadSettings}
            >
              <ArrowDownload20Regular />
              Download All
            </Button>
          )}

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

            // Get chapter progress from map
            const chapterProg = chapterProgress.get(chapter.id)
            const isRead = chapterProg?.completed ?? false
            const pageProgress = chapterProg
              ? { currentPage: chapterProg.currentPage, totalPages: chapter.attributes.pages }
              : undefined

            // Get download status from map
            const downloadStatus = downloadStatusMap.get(chapter.id) || 'not-downloaded'

            return (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isRead={isRead}
                isInProgress={isInProgress}
                pageProgress={pageProgress}
                downloadStatus={downloadStatus}
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
          onConfirm={handleDownloadAll}
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

/**
 * Individual chapter item
 */
interface ChapterItemProps {
  readonly chapter: ChapterEntity
  readonly onClick: () => void
  readonly isRead?: boolean
  readonly isInProgress?: boolean
  readonly pageProgress?: { currentPage: number; totalPages: number }
  readonly downloadStatus?: DownloadStatus
  readonly onDownloadClick?: () => void
}

function ChapterItem({
  chapter,
  onClick,
  isRead,
  isInProgress,
  pageProgress,
  downloadStatus = 'not-downloaded',
  onDownloadClick
}: ChapterItemProps): JSX.Element {
  const chapterNum = chapter.attributes.chapter || '0'
  const title = chapter.attributes.title || 'Untitled'
  const publishDate = new Date(chapter.attributes.publishAt).toLocaleDateString()

  // Get scanlation group name
  const scanlationGroup = chapter.relationships.find((r) => r.type === 'scanlation_group')
  const groupName = String(scanlationGroup?.attributes?.name || 'Unknown Group')

  // Determine status classes
  let statusClass = ''
  if (isInProgress) {
    statusClass = 'chapter-item--in-progress'
  } else if (isRead) {
    statusClass = 'chapter-item--read'
  }

  return (
    <div
      className={`chapter-item ${statusClass}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
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
          <DownloadStatusBadge
            status={downloadStatus}
            onClick={(e) => {
              e.stopPropagation()
              onDownloadClick?.()
            }}
          />
          <span className="chapter-item__date">{publishDate}</span>
        </div>
      </div>
    </div>
  )
}
