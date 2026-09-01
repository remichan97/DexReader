import { useLibraryStore } from '@renderer/stores'
import { getMangaTitle } from '@renderer/utils/mangaHelpers'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import { rendererLog } from '@renderer/services/logging.service'
import type { MangaContract } from '../../../../../preload/window.types'

type MangaEntity = MangaContract
type TFunction = (key: string, options?: Record<string, unknown>) => string

interface ToastOptions {
  title: string
  message: string
  variant: 'info' | 'success' | 'error'
  duration: number
}

export interface UseFavouriteToggleResult {
  isFavourite: (id: string) => boolean
  handleFavouriteToggle: (id: string) => Promise<void>
}

/**
 * Owns favourite-toggling for search results: caches the manga's metadata
 * before favouriting (so it's available offline afterwards), and routes
 * unfavouriting through the shared confirm-and-cleanup-downloads flow.
 */
export function useFavouriteToggle(
  results: MangaEntity[],
  t: TFunction,
  showToast: (options: ToastOptions) => void
): UseFavouriteToggleResult {
  const isFavourite = useLibraryStore((state) => state.isFavourite)
  const toggleFavourite = useLibraryStore((state) => state.toggleFavourite)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)

  const handleFavouriteToggle = async (id: string): Promise<void> => {
    try {
      // Find the manga for caching and toast message
      const manga = results.find((m) => m.id === id)

      if (!manga) {
        throw new Error('Manga not found in results')
      }

      const currentlyFavourited = isFavourite(id)

      if (currentlyFavourited) {
        // Unfavouriting - show dialog with download options
        await handleUnfavourite({
          mangaId: id,
          mangaTitle: getMangaTitle(manga),
          onSuccess: () => {
            // Refresh library store to update heart icon
            loadFavourites()
          }
        })
      } else {
        // Favouriting - cache metadata and toggle
        try {
          await cacheMangaMetadata(manga)
        } catch {
          // Continue with toggle - metadata might already exist
        }

        await toggleFavourite(id)

        showToast({
          title: t('browse:toasts.addedToLibrary'),
          message: getMangaTitle(manga),
          variant: 'info',
          duration: 3000
        })
      }
    } catch (error) {
      rendererLog.error('[useFavouriteToggle] Error toggling favourite:', error)
      showToast({
        title: t('browse:toasts.error'),
        message: t('browse:toasts.failedToUpdate'),
        variant: 'error',
        duration: 3000
      })
    }
  }

  return { isFavourite, handleFavouriteToggle }
}
