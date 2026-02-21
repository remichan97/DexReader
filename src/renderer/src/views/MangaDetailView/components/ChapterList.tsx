import type { JSX } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/Button'
import { Select } from '@renderer/components/Select'
import { Skeleton } from '@renderer/components/Skeleton'
import { DownloadStatusBadge } from '@renderer/components/DownloadStatusBadge'
import type { DownloadStatus } from '@renderer/components/DownloadStatusBadge'
import { DownloadConfirmationDialog } from '@renderer/components/DownloadConfirmationDialog'
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

  // Download dialog state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<ChapterEntity | null>(null)

  // Settings state
  const [downloadSettings, setDownloadSettings] = useState<{
    path: string
    defaultQuality: 'data-saver' | 'high-quality'
    shouldAsk: boolean
  } | null>(null)

  // Download status cache
  const [downloadStatusMap, setDownloadStatusMap] = useState<Map<string, DownloadStatus>>(new Map())

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      const [pathResult, qualityResult, shouldAskResult] = await Promise.all([
        globalThis.settings.getSettingByPath('downloads.downloadPath'),
        globalThis.settings.getSettingByPath('downloads.downloadQuality.defaultQuality'),
        globalThis.settings.getSettingByPath('downloads.downloadQuality.shouldAskForQuality')
      ])

      if (pathResult.success && qualityResult.success && shouldAskResult.success) {
        // Map backend quality format to frontend format
        const quality = qualityResult.data === 'data' ? 'high-quality' : 'data-saver'
        setDownloadSettings({
          path: String(pathResult.data),
          defaultQuality: quality,
          shouldAsk: Boolean(shouldAskResult.data)
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

    // Sort by chapter number
    filtered.sort((a, b) => {
      const aNum = Number.parseFloat(a.attributes.chapter || '0')
      const bNum = Number.parseFloat(b.attributes.chapter || '0')
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
    })

    return filtered
  }, [chapters, sortOrder])

  // Handle download button click
  const handleDownloadClick = (chapter: ChapterEntity): void => {
    setSelectedChapter(chapter)
    setShowDownloadDialog(true)
  }

  // Handle download confirmation
  const handleDownloadConfirm = async (quality: 'data-saver' | 'high-quality'): Promise<void> => {
    if (!selectedChapter) return

    // Map frontend quality to backend ImageQuality enum
    const imageQuality = quality === 'high-quality' ? 'data' : 'data-saver'

    // Add chapter to download queue
    const result = await globalThis.downloads.addToQueue({
      chapterId: selectedChapter.id,
      mangaId: mangaId,
      language: selectedLanguage,
      quality: imageQuality,
      addedAt: new Date()
    })

    if (result.success) {
      // Update status in the map
      setDownloadStatusMap((prev) => new Map(prev).set(selectedChapter.id, 'queued'))
    } else {
      console.error('Failed to add chapter to queue:', result.error)
      // TODO: Show error toast/notification
    }

    setShowDownloadDialog(false)
    setSelectedChapter(null)
  }

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
  const publishDate = new Date(chapter.attributes.publishedAt).toLocaleDateString()

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
    </Button>
  )
}
