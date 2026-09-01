import { useState } from 'react'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import type { MangaContract, ChapterContract } from '../../../../../../../preload/window.types'
import type { DownloadDefaultQuality, DownloadSettingsInfo } from './useMangaDownloadInfo'

type MangaEntity = MangaContract
type ChapterEntity = ChapterContract
type TFunction = (key: string, options?: Record<string, unknown>) => string

interface ToastOptions {
  title: string
  message: string
  variant: 'info' | 'success' | 'error'
  duration: number
}

interface UseDownloadQueueActionsParams {
  manga: MangaEntity
  chapters: ChapterEntity[]
  downloadSettings: DownloadSettingsInfo | null
  t: TFunction
  showToast: (options: ToastOptions) => void
}

export interface UseDownloadQueueActionsResult {
  isOnline: boolean
  showDownloadDialog: boolean
  closeDownloadDialog: () => void
  handleDownloadAll: (quality?: DownloadDefaultQuality) => Promise<void>
  handleDownloadAllClick: () => Promise<void>
  getDownloadButtonTitle: () => string
}

/**
 * Owns the "Download All" button's queueing workflow: deciding whether to
 * show the batch-download confirmation dialog (per the user's confirmation
 * setting) and queueing every chapter once confirmed.
 */
export function useDownloadQueueActions(
  params: UseDownloadQueueActionsParams
): UseDownloadQueueActionsResult {
  const { manga, chapters, downloadSettings, t, showToast } = params
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)

  const closeDownloadDialog = (): void => setShowDownloadDialog(false)

  const handleDownloadAll = async (quality?: DownloadDefaultQuality): Promise<void> => {
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

  return {
    isOnline,
    showDownloadDialog,
    closeDownloadDialog,
    handleDownloadAll,
    handleDownloadAllClick,
    getDownloadButtonTitle
  }
}
