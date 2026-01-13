/**
 * Library Store - User's manga library data (Database-backed)
 *
 * Manages user's favorited manga and collections with database persistence.
 * Replaced localStorage-based bookmarks with direct database integration.
 */

import { create } from 'zustand'
import type { MangaWithMetadata } from '../../../preload/index.d'

export interface LibraryManga {
  mangaId: string
  title: string
  coverUrl?: string
  authors: string[]
  status: string
  lastChapter?: string
  hasNewChapters: boolean
}

interface LibraryState {
  // Data
  favourites: MangaWithMetadata[]
  loading: boolean
  error: string | null

  // Actions
  loadFavourites: () => Promise<void>
  toggleFavourite: (mangaId: string) => Promise<boolean>
  isFavourite: (mangaId: string) => boolean
  refreshLibrary: () => Promise<void>
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  favourites: [],
  loading: false,
  error: null,

  // Load favourites from database
  loadFavourites: async () => {
    set({ loading: true, error: null })
    try {
      const result = await globalThis.library.getLibraryManga({})
      if (result.success && result.data) {
        set({ favourites: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to load library', loading: false })
      }
    } catch (error) {
      console.error('Error loading favourites:', error)
      set({ error: 'Failed to load library', loading: false })
    }
  },

  // Toggle favourite status (add/remove from favourites)
  toggleFavourite: async (mangaId: string) => {
    try {
      const result = await globalThis.library.toggleFavourite(mangaId)
      if (result.success) {
        // Refresh the library after toggling
        await get().loadFavourites()
        return result.data ?? false
      } else {
        set({ error: result.error || 'Failed to toggle favourite' })
        return false
      }
    } catch (error) {
      console.error('Error toggling favourite:', error)
      set({ error: 'Failed to toggle favourite' })
      return false
    }
  },

  // Check if a manga is in favourites
  isFavourite: (mangaId: string) => {
    return get().favourites.some((manga) => manga.mangaId === mangaId)
  },

  // Refresh library data
  refreshLibrary: async () => {
    await get().loadFavourites()
  }
}))
