import { useToastStore } from '@renderer/stores/toastStore'
import { formatBytes } from './formatBytes'

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
        title: 'Failed to check downloads',
        message: 'Please try again'
      })
      onError?.('Failed to check downloads')
      return
    }

    const { chapterCount, totalBytes } = statsResponse.data
    const hasDownloads = chapterCount > 0

    // 2. Show appropriate dialog
    if (hasDownloads) {
      // Two-choice dialog - has downloads
      const result = await globalThis.api.showDialog({
        message: 'Remove from library?',
        detail: `${mangaTitle}\n\nThis manga has ${chapterCount} downloaded chapter${chapterCount > 1 ? 's' : ''} (${formatBytes(totalBytes)}).\n\nDownloads will still be accessible in the Downloads view unless you choose to delete them.`,
        buttons: [
          'Remove from library (keep downloads)',
          'Remove everything (both bookmark and downloads will be removed)',
          'Cancel'
        ],
        type: 'warning',
        defaultId: 2, // Cancel is safe default
        cancelId: 2
      })

      switch (result.data.response) {
        case 0:
          // Remove from library only (downloads remain accessible in Downloads view)
          await executeRemoveFromLibrary(mangaId, mangaTitle, onSuccess, onError)
          break
        case 1:
          // Remove from library AND delete all downloads
          await executeRemoveEverything(mangaId, mangaTitle, chapterCount, onSuccess, onError)
          break
        case 2:
          // User cancelled - do nothing
          break
      }
    } else {
      // Simple confirmation - no downloads
      const confirmed = await globalThis.api.showConfirmDialog(
        'Remove from library?',
        `${mangaTitle}\n\nYou can always add it back later.`,
        'Remove',
        'Cancel'
      )

      if (confirmed.success && confirmed.data) {
        await executeRemoveFromLibrary(mangaId, mangaTitle, onSuccess, onError)
      }
    }
  } catch (error) {
    console.error('Unfavourite error:', error)
    useToastStore.getState().show({
      variant: 'error',
      title: 'Unexpected error',
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
      title: 'Removed from library',
      message: mangaTitle
    })
    onSuccess?.()
  } else {
    useToastStore.getState().show({
      variant: 'error',
      title: 'Failed to remove from library',
      message: result.error || 'Unknown error'
    })
    onError?.(result.error || 'Unknown error')
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
      title: 'Removed completely',
      message: `${mangaTitle} and ${chapterCount} chapter${chapterCount > 1 ? 's' : ''} deleted`
    })
    onSuccess?.()
  } else if (librarySuccess && !downloadsSuccess) {
    useToastStore.getState().show({
      variant: 'warning',
      title: 'Partially removed',
      message: 'Removed from library, but failed to delete some downloads'
    })
    onSuccess?.() // Still call success because library removal worked
  } else if (!librarySuccess && downloadsSuccess) {
    useToastStore.getState().show({
      variant: 'warning',
      title: 'Partially removed',
      message: 'Downloads deleted, but failed to remove from library'
    })
    onSuccess?.() // Still call success because downloads removal worked
  } else {
    useToastStore.getState().show({
      variant: 'error',
      title: 'Failed to remove',
      message: 'Could not complete removal. Please try again.'
    })
    onError?.('Both operations failed')
  }
}
