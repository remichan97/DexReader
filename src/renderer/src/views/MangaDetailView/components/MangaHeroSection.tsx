import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSecureNavigation } from '@renderer/hooks/useSecureNavigation'
import {
  BookOpenRegular,
  PlayCircle24Regular,
  Heart24Regular,
  Heart24Filled,
  ArrowDownload24Regular,
  Person20Regular,
  PaintBrush20Regular,
  BookmarkMultiple20Regular,
  People20Regular,
  Calendar20Regular,
  Star20Regular,
  Book20Regular
} from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Tooltip } from '@renderer/components/Tooltip'
import { DownloadConfirmationDialog } from '@renderer/components/DownloadConfirmationDialog'
import { useLibraryStore, useToastStore } from '@renderer/stores'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import {
  getMangaTitle,
  getContentRatingText,
  mapPublicationStatus
} from '@renderer/utils/mangaHelpers'
import { rendererLog } from '@renderer/services/logging.service'
import type { MangaStatus } from '@renderer/types/components'
import type { MangaContract, ChapterContract } from '../../../../../preload/window.types'

type MangaEntity = MangaContract
type ChapterEntity = ChapterContract

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
  const { secureNavigate } = useSecureNavigation()
  const { t } = useTranslation(['mangaDetail', 'common', 'browse'])
  const { isFavourite, toggleFavourite, loadFavourites } = useLibraryStore()
  const showToast = useToastStore((state) => state.show)
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const coverUrl = manga.coverUrlLarge ?? manga.coverUrl ?? '/placeholder-cover.jpg'
  const title = getMangaTitle(manga)
  const authors = manga.authors
  const artists = manga.artists
  const status = mapPublicationStatus(manga.status)
  const year = manga.year ?? null
  const contentRatingRaw = manga.contentRating?.toLowerCase() || 'safe'
  const contentRating = t(`browse:filter.contentRatings.${contentRatingRaw}`, {
    defaultValue: getContentRatingText(manga.contentRating)
  })
  const demographic = manga.publicationDemographic
  const lastVolume = manga.lastVolume
  const lastChapter = manga.lastChapter

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

  const tags = manga.tags

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
            chapterNumber: lastChapter.chapter,
            chapterTitle: lastChapter.title,
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
        chapterNumber: firstChapter.chapter,
        chapterTitle: firstChapter.title,
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
          title: t('mangaDetail:hero.addedToLibrary.title', { defaultValue: 'Added to Library!' }),
          message: getMangaTitle(manga),
          variant: 'info',
          duration: 3000
        })
      } catch (error) {
        rendererLog.error('[MangaHeroSection] Error adding to library:', error)
        showToast({
          title: t('common:state.error'),
          message: t('mangaDetail:hero.failedToAdd', { defaultValue: 'Failed to add to library' }),
          variant: 'error',
          duration: 3000
        })
      }
    }
  }

  const handleManageDownloads = async (): Promise<void> => {
    if (!downloadStats) return

    const result = await globalThis.api.showDialog({
      message: t('mangaDetail:hero.manageDownloads.title', { defaultValue: 'Manage Downloads' }),
      detail: t('mangaDetail:hero.manageDownloads.detail', {
        title: getMangaTitle(manga),
        count: downloadStats.chapterCount,
        s: downloadStats.chapterCount > 1 ? 's' : '',
        defaultValue: `${getMangaTitle(manga)}\n\nThis manga has ${downloadStats.chapterCount} downloaded chapter${downloadStats.chapterCount > 1 ? 's' : ''}.\n\nYou can add it to your library for tracking, or delete all downloaded chapters.`
      }),
      buttons: [
        t('mangaDetail:hero.manageDownloads.addToLibrary', { defaultValue: 'Add to Library' }),
        t('mangaDetail:hero.manageDownloads.deleteAll', {
          defaultValue: 'Delete All Chapters'
        }),
        t('mangaDetail:hero.manageDownloads.cancel', { defaultValue: 'Nevermind' })
      ],
      type: 'info',
      defaultId: 2,
      cancelId: 2
    })

    if (!result.success || !result.data) return

    switch (result.data.response) {
      case 0:
        // Add to library
        try {
          await toggleFavourite(manga.id)
          showToast({
            title: t('mangaDetail:hero.addedToLibrary.title', {
              defaultValue: 'Added to Library!'
            }),
            message: getMangaTitle(manga),
            variant: 'info',
            duration: 3000
          })
          loadFavourites()
        } catch (error) {
          rendererLog.error('[MangaHeroSection] Error adding to library:', error)
          showToast({
            title: t('common:state.error'),
            message: t('mangaDetail:hero.failedToAdd', {
              defaultValue: 'Failed to add to library'
            }),
            variant: 'error',
            duration: 3000
          })
        }
        break
      case 1: {
        // Delete downloads - confirm first
        const confirmed = await globalThis.api.showConfirmDialog(
          t('mangaDetail:hero.deleteDownloads.title', {
            defaultValue: 'Delete all downloaded chapters?'
          }),
          t('mangaDetail:hero.deleteDownloads.detail', {
            count: downloadStats.chapterCount,
            s: downloadStats.chapterCount > 1 ? 's' : '',
            title: getMangaTitle(manga),
            defaultValue: `This will permanently delete ${downloadStats.chapterCount} chapter${downloadStats.chapterCount > 1 ? 's' : ''} from ${getMangaTitle(manga)}.\n\nThis action cannot be undone.`
          }),
          t('common:button.delete'),
          t('common:button.cancel')
        )

        if (!confirmed.success || !confirmed.data) {
          // User cancelled
          break
        }

        const deleteResult = await globalThis.downloads.deleteManga(manga.id)
        if (deleteResult.success && deleteResult.data?.success) {
          showToast({
            title: t('mangaDetail:toasts.downloadsDeleted.title'),
            message: t('mangaDetail:toasts.downloadsDeleted.message', {
              count: downloadStats.chapterCount,
              s: downloadStats.chapterCount > 1 ? 's' : ''
            }),
            variant: 'success',
            duration: 3000
          })
          void loadDownloadStatsAfterAction()
        } else {
          showToast({
            title: t('mangaDetail:hero.deleteDownloads.failed', {
              defaultValue: 'Failed to delete downloads'
            }),
            message: deleteResult.error || t('common:message.error.unknownError'),
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

  const handleCreatorClick = (creatorId: string | null, creatorType: 'author' | 'artist'): void => {
    if (creatorId) {
      navigate(`/creator/${creatorType}/${creatorId}`)
    }
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
          language: chapter.translatedLanguage,
          quality: selectedQuality,
          addedAt: new Date()
        })
      )
    )

    const successCount = results.filter((r) => r.success).length
    const failCount = chapters.length - successCount

    if (successCount > 0) {
      showToast({
        title: t('mangaDetail:toasts.downloadStarted.title'),
        message: t('mangaDetail:toasts.downloadStarted.message', {
          count: successCount,
          s: successCount === 1 ? '' : 's'
        }),
        variant: 'success',
        duration: 3000
      })
    }

    if (failCount > 0) {
      showToast({
        title: t('mangaDetail:hero.downloadAll.partialFailure', {
          defaultValue: 'Partial Failure'
        }),
        message: t('mangaDetail:hero.downloadAll.couldntQueue', {
          count: failCount,
          s: failCount === 1 ? '' : 's',
          defaultValue: `Couldn't queue ${failCount} chapter${failCount === 1 ? '' : 's'}`
        }),
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
      return t('mangaDetail:hero.inLibrary', { defaultValue: 'In Library' })
    }
    if (downloadStats && downloadStats.chapterCount > 0) {
      return t('mangaDetail:hero.manageDownloads.title', { defaultValue: 'Manage Downloads' })
    }
    return t('common:action.addToLibrary')
  }

  const getDownloadButtonTitle = (): string => {
    if (!isOnline) {
      return t('mangaDetail:hero.downloadAll.offlineTooltip', {
        defaultValue: 'You are offline. Please go online to download'
      })
    }
    if (chapters.length === 0) {
      return t('mangaDetail:hero.downloadAll.noChapters', {
        defaultValue: 'No chapters available'
      })
    }
    return t('mangaDetail:hero.downloadAll.tooltip', {
      defaultValue: 'Download all chapters'
    })
  }

  return (
    <div className="manga-detail-view__hero">
      {/* Cover Image */}
      <div className="manga-detail-view__cover">
        <img
          src={coverUrl}
          alt={t('mangaDetail:hero.coverAlt', {
            title,
            defaultValue: `${title} cover`
          })}
          loading="eager"
        />
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
                aria-label={t('mangaDetail:hero.filterByTag', {
                  name: tag.name,
                  defaultValue: `Filter by ${tag.name}`
                })}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        )}

        <div className="manga-detail-view__metadata">
          <p className="manga-detail-view__author detail-item">
            <Tooltip content={t('mangaDetail:hero.tooltips.author')} position="top">
              <Person20Regular
                aria-label={t('mangaDetail:hero.author', { defaultValue: 'Author' })}
              />
            </Tooltip>
            <span className="creator-list">
              {authors.length > 0
                ? authors.map((creator, index) => (
                    <span key={creator.id}>
                      <button
                        className="creator-link"
                        onClick={() => handleCreatorClick(creator.id, 'author')}
                        title={t('mangaDetail:hero.viewAllByAuthor', {
                          name: creator.name,
                          defaultValue: `View all works by ${creator.name}`
                        })}
                      >
                        {creator.name}
                      </button>
                      {index < authors.length - 1 && ', '}
                    </span>
                  ))
                : 'Unknown'}
            </span>
          </p>
          <p className="manga-detail-view__artist detail-item">
            <Tooltip content={t('mangaDetail:hero.tooltips.artist')} position="top">
              <PaintBrush20Regular
                aria-label={t('mangaDetail:hero.artist', { defaultValue: 'Artist' })}
              />
            </Tooltip>
            <span className="creator-list">
              {artists.length > 0
                ? artists.map((creator, index) => (
                    <span key={creator.id}>
                      <button
                        className="creator-link"
                        onClick={() => handleCreatorClick(creator.id, 'artist')}
                        title={t('mangaDetail:hero.viewAllByArtist', {
                          name: creator.name,
                          defaultValue: `View all works by ${creator.name}`
                        })}
                      >
                        {creator.name}
                      </button>
                      {index < artists.length - 1 && ', '}
                    </span>
                  ))
                : 'Unknown'}
            </span>
          </p>
          <p className="manga-detail-view__status detail-item">
            <Tooltip content={t('mangaDetail:hero.tooltips.status')} position="top">
              <BookmarkMultiple20Regular
                aria-label={t('mangaDetail:hero.status', { defaultValue: 'Status' })}
              />
            </Tooltip>
            <StatusBadge status={status} t={t} />
          </p>
          {demographic && (
            <p className="manga-detail-view__demographic detail-item">
              <Tooltip content={t('mangaDetail:hero.tooltips.demographic')} position="top">
                <People20Regular
                  aria-label={t('mangaDetail:hero.demographic', { defaultValue: 'Demographic' })}
                />
              </Tooltip>
              <DemographicBadge demographic={demographic} t={t} />
            </p>
          )}
          {year && (
            <p className="manga-detail-view__year detail-item">
              <Tooltip content={t('mangaDetail:hero.tooltips.year')} position="top">
                <Calendar20Regular
                  aria-label={t('mangaDetail:hero.year', { defaultValue: 'Year' })}
                />
              </Tooltip>
              <span>{year}</span>
            </p>
          )}
          <p className="manga-detail-view__rating detail-item">
            <Tooltip content={t('mangaDetail:hero.tooltips.contentRating')} position="top">
              <Star20Regular
                aria-label={t('mangaDetail:hero.rating', { defaultValue: 'Rating' })}
              />
            </Tooltip>
            <span>{contentRating}</span>
          </p>
          {(lastVolume || lastChapter) && (
            <p className="manga-detail-view__length detail-item">
              <Tooltip content={t('mangaDetail:hero.tooltips.lastChapter')} position="top">
                <Book20Regular
                  aria-label={t('mangaDetail:hero.length', { defaultValue: 'Length' })}
                />
              </Tooltip>
              <span>
                {lastVolume &&
                  t('mangaDetail:hero.volumeCount', {
                    count: lastVolume,
                    s: lastVolume === '1' ? '' : 's',
                    defaultValue: `${lastVolume} volume${lastVolume === '1' ? '' : 's'}`
                  })}
                {lastVolume && lastChapter && ' • '}
                {lastChapter &&
                  t('mangaDetail:hero.chapterCount', {
                    count: lastChapter,
                    s: lastChapter === '1' ? '' : 's',
                    defaultValue: `${lastChapter} chapter${lastChapter === '1' ? '' : 's'}`
                  })}
              </span>
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
              {t('mangaDetail:hero.continue', { defaultValue: 'Continue' })}
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<BookOpenRegular />}
            >
              {t('mangaDetail:hero.startReading', { defaultValue: 'Start Reading' })}
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
            {t('mangaDetail:hero.downloadAll.button', { defaultValue: 'Download All' })}
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
          onOpenSettings={() => void secureNavigate('/settings')}
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
  readonly t: (key: string, options?: Record<string, unknown>) => string
}

function StatusBadge({ status, t }: StatusBadgeProps): JSX.Element {
  const translatedStatus = t(`browse:filter.statuses.${status}`, {
    defaultValue: status.charAt(0).toUpperCase() + status.slice(1)
  })
  return (
    <span className={`status-badge status-badge--${status} inline-flex`}>{translatedStatus}</span>
  )
}

/**
 * Demographic badge component
 */
interface DemographicBadgeProps {
  readonly demographic: string
  readonly t: (key: string, options?: Record<string, unknown>) => string
}

function DemographicBadge({ demographic, t }: DemographicBadgeProps): JSX.Element {
  const translatedDemographic = t(`browse:filter.demographics.${demographic}`, {
    defaultValue: demographic.charAt(0).toUpperCase() + demographic.slice(1)
  })
  return (
    <span className={`demographic-badge demographic-badge--${demographic} inline-flex`}>
      {translatedDemographic}
    </span>
  )
}
