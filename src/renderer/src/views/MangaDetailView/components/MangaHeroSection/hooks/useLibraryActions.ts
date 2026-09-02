import { useLibraryStore } from '@renderer/stores'
import { getMangaTitle } from '@renderer/utils/mangaHelpers'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import { rendererLog } from '@renderer/services/logging.service'
import type { MangaContract } from '../../../../../../../preload/window.types'
import type { DownloadStatsInfo } from './useMangaDownloadInfo'

type MangaEntity = MangaContract
type TFunction = (key: string, options?: Record<string, unknown>) => string

interface ToastOptions {
  title: string
  message: string
  variant: 'info' | 'success' | 'error'
  duration: number
}

interface UseLibraryActionsParams {
  manga: MangaEntity
  downloadStats: DownloadStatsInfo | null
  refreshDownloadStats: () => Promise<void>
  t: TFunction
  showToast: (options: ToastOptions) => void
}

export interface UseLibraryActionsResult {
  isFavourite: boolean
  handleAddToLibrary: () => Promise<void>
  getLibraryButtonLabel: () => string
}

/**
 * Owns the "Add to Library" button's favourite-toggle logic and the
 * manage-downloads dialog workflow it falls into when a non-favourited manga
 * already has downloaded chapters (add to library / delete all / cancel).
 */
export function useLibraryActions(params: UseLibraryActionsParams): UseLibraryActionsResult {
  const { manga, downloadStats, refreshDownloadStats, t, showToast } = params
  const isFavourite = useLibraryStore((state) => state.isFavourite)
  const toggleFavourite = useLibraryStore((state) => state.toggleFavourite)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)

  async function addToLibrary(): Promise<void> {
    try {
      // toggleFavourite already refreshes the library store internally
      await toggleFavourite(manga.id)
      showToast({
        title: t('mangaDetail:hero.addedToLibrary.title', { defaultValue: 'Added to Library!' }),
        message: getMangaTitle(manga),
        variant: 'info',
        duration: 3000
      })
    } catch (error) {
      rendererLog.error('[useLibraryActions] Error adding to library:', error)
      showToast({
        title: t('common:state.error'),
        message: t('mangaDetail:hero.failedToAdd', { defaultValue: 'Failed to add to library' }),
        variant: 'error',
        duration: 3000
      })
    }
  }

  async function deleteAllDownloads(): Promise<void> {
    if (!downloadStats) return

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
      return
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
      void refreshDownloadStats()
    } else {
      showToast({
        title: t('mangaDetail:hero.deleteDownloads.failed', {
          defaultValue: 'Failed to delete downloads'
        }),
        message: deleteResult.error?.message || t('common:message.error.unknownError'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  async function handleManageDownloads(): Promise<void> {
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
        await addToLibrary()
        break
      case 1:
        await deleteAllDownloads()
        break
      case 2:
        // Cancelled
        break
    }
  }

  async function handleAddToLibrary(): Promise<void> {
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
          void refreshDownloadStats()
        }
      })
    } else if (hasDownloads) {
      // Not favourited but has downloads - offer to manage downloads or add to library
      await handleManageDownloads()
    } else {
      // No downloads, just add to library
      await addToLibrary()
    }
  }

  function getLibraryButtonLabel(): string {
    if (isFavourite(manga.id)) {
      return t('mangaDetail:hero.inLibrary', { defaultValue: 'In Library' })
    }
    if (downloadStats && downloadStats.chapterCount > 0) {
      return t('mangaDetail:hero.manageDownloads.title', { defaultValue: 'Manage Downloads' })
    }
    return t('common:action.addToLibrary')
  }

  return {
    isFavourite: isFavourite(manga.id),
    handleAddToLibrary,
    getLibraryButtonLabel
  }
}
