import { useToastStore } from '@renderer/stores/toastStore'
import { formatBytes } from './formatBytes'
import { rendererLog } from '@renderer/services/logging.service'
import i18next from 'i18next'

export interface UnfavouriteOptions {
  mangaId: string
  mangaTitle: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

/**
 * Handle unfavouriting manga with smart download handling
 *
 * Library now shows ONLY explicitly favorited manga.
 * Downloads are independent and managed in Downloads view.
 *
 * Shows simple confirmation if no downloads exist
 * Shows 2-option dialog if downloads exist:
 * - Remove from library only (keep downloads - accessible via Downloads view)
 * - Remove from library AND delete all downloads
 */
export async function handleUnfavourite(options: UnfavouriteOptions): Promise<void> {
  const { mangaId, mangaTitle, onSuccess, onError } = options

  try {
    // 1. Check if manga has downloads
    const statsResponse = await globalThis.downloads.getDownloadStats(mangaId)

    if (!statsResponse.success || !statsResponse.data) {
      // Error checking downloads - show error toast
      useToastStore.getState().show({
        variant: 'error',
        title: i18next.t('library:toasts.error'),
        message: i18next.t('library:toasts.checkDownloadsFailed')
      })
      onError?.(i18next.t('library:toasts.checkDownloadsFailed'))
      return
    }

    const { chapterCount, totalBytes } = statsResponse.data
    const hasDownloads = chapterCount > 0

    // 2. Show appropriate dialog
    if (hasDownloads) {
      // Two-choice dialog - has downloads
      const result = await globalThis.api.showDialog({
        message: i18next.t('dialogs:confirmations.removeFromLibrary.withDownloads.title'),
        detail: i18next.t('dialogs:confirmations.removeFromLibrary.withDownloads.message', {
          title: mangaTitle,
          count: chapterCount,
          plural: chapterCount > 1 ? 's' : '',
          size: formatBytes(totalBytes)
        }),
        buttons: [
          i18next.t('dialogs:confirmations.removeFromLibrary.withDownloads.buttons.keepDownloads'),
          i18next.t(
            'dialogs:confirmations.removeFromLibrary.withDownloads.buttons.deleteEverything'
          ),
          i18next.t('dialogs:confirmations.removeFromLibrary.withDownloads.buttons.cancel')
        ],
        type: 'warning',
        defaultId: 2, // Cancel is safe default
        cancelId: 2
      })

      if (!result.success || !result.data) {
        return
      }

      switch (result.data.response) {
        case 0:
          // Remove from library only (downloads remain accessible in Downloads view)
          await executeRemoveFromLibrary(mangaId, mangaTitle, onSuccess, onError)
          break
        case 1: {
          // Remove from library AND delete all downloads
          // Ask for final confirmation before deleting downloads since this cannot be undone
          const confirmed = await globalThis.api.showConfirmDialog(
            i18next.t('dialogs:confirmations.removeFromLibrary.finalConfirmation.title'),
            i18next.t('dialogs:confirmations.removeFromLibrary.finalConfirmation.message', {
              title: mangaTitle
            }),
            i18next.t('dialogs:confirmations.removeFromLibrary.finalConfirmation.confirmButton'),
            i18next.t('dialogs:confirmations.removeFromLibrary.finalConfirmation.cancelButton')
          )

          if (confirmed.success && confirmed.data) {
            await executeRemoveEverything(mangaId, mangaTitle, chapterCount, onSuccess, onError)
          }
          break
        }
        case 2:
          // User cancelled - do nothing
          break
      }
    } else {
      // Simple confirmation - no downloads
      const confirmed = await globalThis.api.showConfirmDialog(
        i18next.t('dialogs:confirmations.removeFromLibrary.noDownloads.title'),
        i18next.t('dialogs:confirmations.removeFromLibrary.noDownloads.message', {
          title: mangaTitle
        }),
        i18next.t('dialogs:confirmations.removeFromLibrary.noDownloads.confirmButton'),
        i18next.t('dialogs:confirmations.removeFromLibrary.noDownloads.cancelButton')
      )

      if (confirmed.success && confirmed.data) {
        await executeRemoveFromLibrary(mangaId, mangaTitle, onSuccess, onError)
      }
    }
  } catch (error) {
    rendererLog.error('[UnfavouriteHandler] Unfavourite error:', error)
    useToastStore.getState().show({
      variant: 'error',
      title: i18next.t('library:toasts.unexpectedError'),
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    onError?.(error instanceof Error ? error.message : 'Unknown error')
  }
}

async function executeRemoveFromLibrary(
  mangaId: string,
  mangaTitle: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  const result = await globalThis.library.toggleFavourite(mangaId)

  if (result.success) {
    useToastStore.getState().show({
      variant: 'success',
      title: i18next.t('library:toasts.removedFromLibrary'),
      message: mangaTitle
    })
    onSuccess?.()
  } else {
    useToastStore.getState().show({
      variant: 'error',
      title: i18next.t('library:toasts.error'),
      message: i18next.t('library:toasts.failedToRemove')
    })
    onError?.(result.error?.message || 'Unknown error')
  }
}

async function executeRemoveEverything(
  mangaId: string,
  mangaTitle: string,
  chapterCount: number,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  // Execute both operations
  const [libraryResult, downloadsResult] = await Promise.all([
    globalThis.library.toggleFavourite(mangaId),
    globalThis.downloads.deleteManga(mangaId)
  ])

  const librarySuccess = libraryResult.success
  const downloadsSuccess = downloadsResult.success && downloadsResult.data?.success

  if (librarySuccess && downloadsSuccess) {
    useToastStore.getState().show({
      variant: 'success',
      title: i18next.t('library:toasts.removedCompletely'),
      message: i18next.t('library:toasts.removedWithDetails', {
        title: mangaTitle,
        count: chapterCount,
        plural: chapterCount > 1 ? 's' : ''
      })
    })
    onSuccess?.()
  } else if (librarySuccess && !downloadsSuccess) {
    useToastStore.getState().show({
      variant: 'warning',
      title: i18next.t('library:toasts.partiallyRemoved.title'),
      message: i18next.t('library:toasts.partiallyRemoved.libraryOnly')
    })
    onSuccess?.() // Still call success because library removal worked
  } else if (!librarySuccess && downloadsSuccess) {
    useToastStore.getState().show({
      variant: 'warning',
      title: i18next.t('library:toasts.partiallyRemoved.title'),
      message: i18next.t('library:toasts.partiallyRemoved.downloadsOnly')
    })
    onSuccess?.() // Still call success because downloads removal worked
  } else {
    useToastStore.getState().show({
      variant: 'error',
      title: i18next.t('library:toasts.error'),
      message: i18next.t('library:toasts.couldNotRemove')
    })
    onError?.('Both operations failed')
  }
}
