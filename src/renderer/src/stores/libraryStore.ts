/**
 * Library Store - User's manga library data (Phase 3 skeleton)
 *
 * This is a placeholder store for future Phase 3 development.
 * Currently implements basic bookmark functionality to demonstrate the pattern.
 *
 * Future features (Phase 3):
 * - Full manga metadata storage
 * - Collections/reading lists
 * - Reading progress tracking
 * - Recently read history
 * - Favourites with notes/ratings
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Collection } from './types'

interface LibraryState {
  // Bookmarks - Simple array of manga IDs for now
  bookmarks: string[]

  // Collections - Placeholder for Phase 3
  collections: Collection[]

  // Actions
  addBookmark: (mangaId: string) => void
  removeBookmark: (mangaId: string) => void
  isBookmarked: (mangaId: string) => boolean

  // Collection actions (placeholder)
  addCollection: (name: string) => string // Returns collection ID
  removeCollection: (collectionId: string) => void
  addToCollection: (collectionId: string, mangaId: string) => void
  removeFromCollection: (collectionId: string, mangaId: string) => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      collections: [],

      // Bookmark management
      addBookmark: (mangaId) =>
        set((state) => {
          // Prevent duplicates
          if (state.bookmarks.includes(mangaId)) {
            return state
          }
          return {
            bookmarks: [...state.bookmarks, mangaId]
          }
        }),

      removeBookmark: (mangaId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((id) => id !== mangaId)
        })),

      isBookmarked: (mangaId) => {
        return get().bookmarks.includes(mangaId)
      },

      // Collection management (placeholder for Phase 3)
      addCollection: (name) => {
        const collectionId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const newCollection: Collection = {
          id: collectionId,
          name,
          mangaIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        set((state) => ({
          collections: [...state.collections, newCollection]
        }))

        return collectionId
      },

      removeCollection: (collectionId) =>
        set((state) => ({
          collections: state.collections.filter((col) => col.id !== collectionId)
        })),

      addToCollection: (collectionId, mangaId) =>
        set((state) => ({
          collections: state.collections.map((col) => {
            if (col.id === collectionId && !col.mangaIds.includes(mangaId)) {
              return {
                ...col,
                mangaIds: [...col.mangaIds, mangaId],
                updatedAt: Date.now()
              }
            }
            return col
          })
        })),

      removeFromCollection: (collectionId, mangaId) =>
        set((state) => ({
          collections: state.collections.map((col) => {
            if (col.id === collectionId) {
              return {
                ...col,
                mangaIds: col.mangaIds.filter((id) => id !== mangaId),
                updatedAt: Date.now()
              }
            }
            return col
          })
        }))
    }),
    {
      name: 'dexreader-library' // localStorage key
    }
  )
)
