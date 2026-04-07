import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenRegular,
  PlayCircle24Regular,
  Heart24Regular,
  Heart24Filled,
  ArrowDownload24Regular
} from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { DownloadConfirmationDialog } from '@renderer/components/DownloadConfirmationDialog'
import { useLibraryStore, useToastStore } from '@renderer/stores'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import {
  getCoverImageUrl,
  getMangaTitle,
  getAuthorName,
  getArtistName,
  getMangaYear,
  getContentRatingText,
  mapPublicationStatus,
  CoverSize,
  type MangaStatus
} from '@renderer/utils/mangaHelpers'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface MangaHeroSectionProps {
  readonly manga: MangaEntity
  readonly chapters: ChapterEntity[]
  readonly progress: NonNullable<
    Awaited<ReturnType<Window['progress']['getProgress']>>['data']
  > | null
}

/**
 * Hero section with cover image and metadata
 */
export default function MangaHeroSection({
  manga,
  chapters,
  progress
}: MangaHeroSectionProps): JSX.Element {
  const navigate = useNavigate()
  const { isFavourite, toggleFavourite, loadFavourites } = useLibraryStore()
  const showToast = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const coverUrl = getCoverImageUrl(manga, CoverSize.Large)
  const title = getMangaTitle(manga)
  const author = getAuthorName(manga)
  const artist = getArtistName(manga)
  const status = mapPublicationStatus(manga.attributes.status)
  const year = getMangaYear(manga)
  const contentRating = getContentRatingText(manga.attributes.contentRating)
  const demographic = manga.attributes.publicationDemographic
  const lastVolume = manga.attributes.lastVolume
  const lastChapter = manga.attributes.lastChapter

  // Download state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [downloadSettings, setDownloadSettings] = useState<{
    path: string
    defaultQuality: 'data' | 'data-saver'
    confirmation: 'always' | 'batch-only' | 'never'
  } | null>(null)
  const [downloadStats, setDownloadStats] = useState<{
    chapterCount: number
    totalBytes: number
  } | null>(null)

  // Load download settings and stats
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

    async function loadDownloadStats(): Promise<void> {
      const statsResponse = await globalThis.downloads.getDownloadStats(manga.id)
      if (statsResponse.success && statsResponse.data) {
        setDownloadStats(statsResponse.data)
      }
    }

    void loadSettings()
    void loadDownloadStats()
  }, [manga.id])

  // Extract tags from attributes
  const tags =
    (
      manga.attributes as {
        tags?: Array<{ id: string; attributes: { name: { en?: string }; group: string } }>
      }
    )?.tags?.map((tag) => ({
      id: tag.id,
      name: tag.attributes.name.en || 'Unknown',
      group: tag.attributes.group
    })) || []

  const handleReadClick = (): void => {
    if (chapters.length === 0) return

    // If progress exists, continue from last read position
    if (progress) {
      const lastChapter = chapters.find((ch) => ch.id === progress.lastChapterId)
      if (lastChapter) {
        // Continue from last read page
        const startPage = progress.currentPage

        navigate(`/reader/${manga.id}/${lastChapter.id}`, {
          state: {
            chapterNumber: lastChapter.attributes.chapter,
            chapterTitle: lastChapter.attributes.title,
            mangaTitle: getMangaTitle(manga),
            chapters: chapters,
            startPage, // Start at last read page
            coverUrl // Pass cover URL for progress tracking
          }
        })
        return
      }
    }

    // Navigate to first chapter (no progress or chapter not found)
    const firstChapter = chapters[0]
    navigate(`/reader/${manga.id}/${firstChapter.id}`, {
      state: {
        chapterNumber: firstChapter.attributes.chapter,
        chapterTitle: firstChapter.attributes.title,
        mangaTitle: getMangaTitle(manga),
        chapters: chapters,
        coverUrl // Pass cover URL for progress tracking // Pass full chapter list for navigation
      }
    })
  }

  const handleAddToLibrary = async (): Promise<void> => {
    const currentlyFavourited = isFavourite(manga.id)
    const hasDownloads = downloadStats && downloadStats.chapterCount > 0

    if (currentlyFavourited) {
      // Unfavouriting - show dialog with download options
      await handleUnfavourite({
        mangaId: manga.id,
        mangaTitle: getMangaTitle(manga),
        onSuccess: () => {
          // Refresh library store and download stats
          loadFavourites()
          void loadDownloadStatsAfterAction()
        }
      })
    } else if (hasDownloads) {
      // Not favorited but has downloads - offer to manage downloads or add to library
      await handleManageDownloads()
    } else {
      // No downloads, just add to library
      try {
        await toggleFavourite(manga.id)

        showToast({
          title: 'Added to Library!',
          message: getMangaTitle(manga),
          variant: 'info',
          duration: 3000
        })
      } catch (error) {
        console.error('Error adding to library:', error)
        showToast({
          title: 'Error',
          message: 'Failed to add to library',
          variant: 'error',
          duration: 3000
        })
      }
    }
  }

  const handleManageDownloads = async (): Promise<void> => {
    if (!downloadStats) return

    const result = await globalThis.api.showDialog({
      message: 'Manage Downloads',
      detail: `${getMangaTitle(manga)}\n\nThis manga has ${downloadStats.chapterCount} downloaded chapter${downloadStats.chapterCount > 1 ? 's' : ''}.\n\nYou can add it to your library for tracking, or delete all downloaded chapters.`,
      buttons: ['Add to Library', 'Delete All Chapters', 'Cancel'],
      type: 'info',
      defaultId: 2,
      cancelId: 2
    })

    switch (result.data.response) {
      case 0:
        // Add to library
        try {
          await toggleFavourite(manga.id)
          showToast({
            title: 'Added to Library!',
            message: getMangaTitle(manga),
            variant: 'info',
            duration: 3000
          })
          loadFavourites()
        } catch (error) {
          console.error('Error adding to library:', error)
          showToast({
            title: 'Error',
            message: 'Failed to add to library',
            variant: 'error',
            duration: 3000
          })
        }
        break
      case 1: {
        // Delete downloads - confirm first
        const confirmed = await globalThis.api.showConfirmDialog(
          'Delete all downloaded chapters?',
          `This will permanently delete ${downloadStats.chapterCount} chapter${downloadStats.chapterCount > 1 ? 's' : ''} from ${getMangaTitle(manga)}.\n\nThis action cannot be undone.`,
          'Delete',
          'Cancel'
        )

        if (!confirmed.success || !confirmed.data) {
          // User cancelled
          break
        }

        const deleteResult = await globalThis.downloads.deleteManga(manga.id)
        if (deleteResult.success && deleteResult.data?.success) {
          showToast({
            title: 'Downloads deleted',
            message: `Deleted ${downloadStats.chapterCount} chapter${downloadStats.chapterCount > 1 ? 's' : ''}`,
            variant: 'success',
            duration: 3000
          })
          void loadDownloadStatsAfterAction()
        } else {
          showToast({
            title: 'Failed to delete downloads',
            message: deleteResult.error || 'Unknown error',
            variant: 'error',
            duration: 3000
          })
        }
        break
      }
      case 2:
        // Cancelled
        break
    }
  }

  const loadDownloadStatsAfterAction = async (): Promise<void> => {
    const statsResponse = await globalThis.downloads.getDownloadStats(manga.id)
    if (statsResponse.success && statsResponse.data) {
      setDownloadStats(statsResponse.data)
    } else {
      setDownloadStats(null)
    }
  }

  const handleTagClick = (tagId: string): void => {
    navigate(`/browse?tag=${tagId}`)
  }

  const handleDownloadAll = async (quality?: 'data' | 'data-saver'): Promise<void> => {
    if (!downloadSettings || chapters.length === 0) return

    const selectedQuality = quality || downloadSettings.defaultQuality

    // Queue all chapters for download
    const results = await Promise.all(
      chapters.map((chapter) =>
        globalThis.downloads.addToQueue({
          chapterId: chapter.id,
          mangaId: manga.id,
          language: chapter.attributes.translatedLanguage,
          quality: selectedQuality,
          addedAt: new Date()
        })
      )
    )

    const successCount = results.filter((r) => r.success).length
    const failCount = chapters.length - successCount

    if (successCount > 0) {
      showToast({
        title: 'Download Started',
        message: `Queued ${successCount} chapter${successCount === 1 ? '' : 's'} for download`,
        variant: 'success',
        duration: 3000
      })
    }

    if (failCount > 0) {
      showToast({
        title: 'Partial Failure',
        message: `Failed to queue ${failCount} chapter${failCount === 1 ? '' : 's'}`,
        variant: 'error',
        duration: 5000
      })
    }

    setShowDownloadDialog(false)
  }

  const handleDownloadAllClick = async (): Promise<void> => {
    if (!downloadSettings || chapters.length === 0) return

    // Check confirmation setting
    if (downloadSettings.confirmation === 'never') {
      // Download immediately with default quality
      await handleDownloadAll()
    } else if (
      downloadSettings.confirmation === 'batch-only' ||
      downloadSettings.confirmation === 'always'
    ) {
      // Show dialog for batch download
      setShowDownloadDialog(true)
    }
  }

  const getLibraryButtonLabel = (): string => {
    if (isFavourite(manga.id)) {
      return 'In Library'
    }
    if (downloadStats && downloadStats.chapterCount > 0) {
      return 'Manage Downloads'
    }
    return 'Add to Library'
  }

  const getDownloadButtonTitle = (): string => {
    if (!isOnline) {
      return 'You are offline. Please go online to download'
    }
    if (chapters.length === 0) {
      return 'No chapters available'
    }
    return 'Download all chapters'
  }

  return (
    <div className="manga-detail-view__hero">
      {/* Cover Image */}
      <div className="manga-detail-view__cover">
        <img src={coverUrl} alt={`${title} cover`} loading="eager" />
      </div>

      {/* Metadata */}
      <div className="manga-detail-view__info flex flex-col gap-3">
        <h1 className="manga-detail-view__title">{title}</h1>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="manga-detail-view__tags-row flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                className="tag tag--theme inline-flex"
                onClick={() => handleTagClick(tag.id)}
                aria-label={`Filter by ${tag.name}`}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        )}

        <div className="manga-detail-view__metadata flex flex-col gap-2">
          <p className="manga-detail-view__author">
            <strong>Author:</strong> {author}
          </p>
          <p className="manga-detail-view__artist">
            <strong>Artist:</strong> {artist}
          </p>
          <p className="manga-detail-view__status">
            <strong>Status:</strong> <StatusBadge status={status} />
          </p>
          {demographic && (
            <p className="manga-detail-view__demographic">
              <strong>Demographic:</strong> <DemographicBadge demographic={demographic} />
            </p>
          )}
          {year && (
            <p className="manga-detail-view__year">
              <strong>Year:</strong> {year}
            </p>
          )}
          <p className="manga-detail-view__rating">
            <strong>Rating:</strong> {contentRating}
          </p>
          {(lastVolume || lastChapter) && (
            <p className="manga-detail-view__length">
              <strong>Length:</strong>{' '}
              {lastVolume && `${lastVolume} volume${lastVolume === '1' ? '' : 's'}`}
              {lastVolume && lastChapter && ' • '}
              {lastChapter && `${lastChapter} chapter${lastChapter === '1' ? '' : 's'}`}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="manga-detail-view__actions flex gap-2">
          {progress ? (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<PlayCircle24Regular />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<BookOpenRegular />}
            >
              Start Reading
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleAddToLibrary}
            icon={isFavourite(manga.id) ? <Heart24Filled /> : <Heart24Regular />}
          >
            {getLibraryButtonLabel()}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadAllClick}
            disabled={chapters.length === 0 || !downloadSettings || !isOnline}
            title={getDownloadButtonTitle()}
            icon={<ArrowDownload24Regular />}
          >
            Download All
          </Button>
        </div>
      </div>

      {/* Download confirmation dialog */}
      {downloadSettings && (
        <DownloadConfirmationDialog
          isOpen={showDownloadDialog}
          onClose={() => setShowDownloadDialog(false)}
          onConfirm={handleDownloadAll}
          chapterCount={chapters.length}
          defaultQuality={downloadSettings.defaultQuality}
          downloadsPath={downloadSettings.path}
          showBatchInfo={downloadSettings.confirmation === 'batch-only'}
          onOpenSettings={() => navigate('/settings')}
        />
      )}
    </div>
  )
}

/**
 * Status badge component
 */
interface StatusBadgeProps {
  readonly status: MangaStatus
}

function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  return (
    <span className={`status-badge status-badge--${status} inline-flex`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/**
 * Demographic badge component
 */
interface DemographicBadgeProps {
  readonly demographic: string
}

function DemographicBadge({ demographic }: DemographicBadgeProps): JSX.Element {
  const displayText = demographic.charAt(0).toUpperCase() + demographic.slice(1)
  return (
    <span className={`demographic-badge demographic-badge--${demographic} inline-flex`}>
      {displayText}
    </span>
  )
}
