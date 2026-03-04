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
 * Shows simple confirmation if no downloads exist
 * Shows 3-option dialog if downloads exist:
 * - Remove from library only (keep downloads)
 * - Delete downloads only (keep bookmark)
 * - Remove everything
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
      // Multi-choice dialog - has downloads
      const result = await globalThis.api.showDialog({
        message: 'Remove from library?',
        detail: `${mangaTitle}\n\nThis manga has ${chapterCount} downloaded chapter${chapterCount > 1 ? 's' : ''} (${formatBytes(totalBytes)}).\n\nWhat would you like to do?`,
        buttons: [
          'Remove from library only (keep downloads)',
          'Delete downloads only (keep bookmark)',
          'Remove everything',
          'Cancel'
        ],
        type: 'warning',
        defaultId: 3, // Cancel is safe default
        cancelId: 3
      })

      switch (result.data.response) {
        case 0:
          // Remove from library only
          await executeRemoveFromLibrary(mangaId, mangaTitle, onSuccess, onError)
          break
        case 1:
          // Delete downloads only
          await executeDeleteDownloads(mangaId, mangaTitle, chapterCount, onSuccess, onError)
          break
        case 2:
          // Remove everything
          await executeRemoveEverything(mangaId, mangaTitle, chapterCount, onSuccess, onError)
          break
        case 3:
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

async function executeDeleteDownloads(
  mangaId: string,
  mangaTitle: string,
  chapterCount: number,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  const result = await globalThis.downloads.deleteManga(mangaId)

  if (result.success && result.data?.success) {
    useToastStore.getState().show({
      variant: 'success',
      title: 'Downloads deleted',
      message: `Deleted ${chapterCount} chapter${chapterCount > 1 ? 's' : ''} from ${mangaTitle}`
    })
    onSuccess?.()
  } else {
    useToastStore.getState().show({
      variant: 'error',
      title: 'Failed to delete downloads',
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
