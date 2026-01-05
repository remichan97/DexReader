/**
 * Collections Store - User's manga collections (Database-backed)
 *
 * Manages user-created collections with database persistence.
 */

import { create } from 'zustand'

interface Collection {
  id: number
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface CollectionsState {
  // Data
  collections: Collection[]
  loading: boolean
  error: string | null

  // Actions
  loadCollections: () => Promise<void>
  createCollection: (command: { name: string; description?: string }) => Promise<Collection | null>
  updateCollection: (command: { id: number; name?: string; description?: string }) => Promise<void>
  deleteCollection: (collectionId: number) => Promise<void>
  addToCollection: (command: { collectionId: number; mangaId: string }) => Promise<void>
  removeFromCollection: (
    commands: Array<{ collectionId: number; mangaId: string }>
  ) => Promise<void>
}

export const useCollectionsStore = create<CollectionsState>()((set, get) => ({
  collections: [],
  loading: false,
  error: null,

  // Load all collections from database
  loadCollections: async () => {
    set({ loading: true, error: null })
    try {
      const result = await globalThis.collections.getAllCollections()
      if (result.success && result.data) {
        set({ collections: result.data, loading: false })
      } else {
        set({ error: result.error || 'Failed to load collections', loading: false })
      }
    } catch (error) {
      console.error('Error loading collections:', error)
      set({ error: 'Failed to load collections', loading: false })
    }
  },

  // Create a new collection
  createCollection: async (command: { name: string; description?: string }) => {
    try {
      const result = await globalThis.collections.createCollection(command)
      if (result.success && result.data) {
        // Reload collections after creation
        await get().loadCollections()
        return result.data
      } else {
        const errorMsg =
          typeof result.error === 'string' ? result.error : 'Failed to create collection'
        set({ error: errorMsg })
        return null
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      set({ error: 'Failed to create collection' })
      return null
    }
  },

  // Update an existing collection
  updateCollection: async (command: { id: number; name?: string; description?: string }) => {
    try {
      const result = await globalThis.collections.updateCollection(command)
      if (result.success) {
        // Reload collections after update
        await get().loadCollections()
      } else {
        const errorMsg =
          typeof result.error === 'string' ? result.error : 'Failed to update collection'
        set({ error: errorMsg })
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      set({ error: 'Failed to update collection' })
    }
  },

  // Delete a collection
  deleteCollection: async (collectionId: number) => {
    try {
      const result = await globalThis.collections.deleteCollection(collectionId)
      if (result.success) {
        // Reload collections after deletion
        await get().loadCollections()
      } else {
        const errorMsg =
          typeof result.error === 'string' ? result.error : 'Failed to delete collection'
        set({ error: errorMsg })
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      set({ error: 'Failed to delete collection' })
    }
  },

  // Add manga to a collection
  addToCollection: async (command: { collectionId: number; mangaId: string }) => {
    try {
      const result = await globalThis.collections.addToCollection(command)
      if (!result.success) {
        const errorMsg =
          typeof result.error === 'string' ? result.error : 'Failed to add manga to collection'
        set({ error: errorMsg })
      }
      // Note: We don't reload collections here as it doesn't change the collection list
    } catch (error) {
      console.error('Error adding manga to collection:', error)
      set({ error: 'Failed to add manga to collection' })
    }
  },

  // Remove manga from a collection
  removeFromCollection: async (commands: Array<{ collectionId: number; mangaId: string }>) => {
    try {
      const result = await globalThis.collections.removeFromCollection(commands)
      if (!result.success) {
        const errorMsg =
          typeof result.error === 'string' ? result.error : 'Failed to remove manga from collection'
        set({ error: errorMsg })
      }
      // Note: We don't reload collections here as it doesn't change the collection list
    } catch (error) {
      console.error('Error removing manga from collection:', error)
      set({ error: 'Failed to remove manga from collection' })
    }
  }
}))
