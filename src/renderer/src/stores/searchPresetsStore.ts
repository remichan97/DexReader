/**
 * Search Presets Store - Saved search configurations
 *
 * Manages saved search presets with database persistence.
 * Users can save their search query + filters as reusable presets.
 */

import { create } from 'zustand'
import type { SearchFiltersData } from '@shared/contracts/settings/search-filters.contract'
import type { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'
import { rendererLog } from '../services/logging.service'

interface SearchPresetsState {
  // Data
  presets: SearchPresetQuery[]
  loading: boolean
  error: string | null

  // Actions
  loadPresets: () => Promise<void>
  createPreset: (command: {
    name: string
    searchQuery?: string
    filters: SearchFiltersData
    resultsPerPage?: number
    setAsDefault?: boolean
  }) => Promise<SearchPresetQuery | null>
  deletePreset: (id: number) => Promise<void>
  updateLastUsedAt: (id: number) => Promise<void>

  // Helpers
  getPresetById: (id: number) => SearchPresetQuery | undefined
  getPresetByName: (name: string) => SearchPresetQuery | undefined
}

export const useSearchPresetsStore = create<SearchPresetsState>()((set, get) => ({
  presets: [],
  loading: false,
  error: null,

  // Load all presets from database
  loadPresets: async () => {
    set({ loading: true, error: null })
    try {
      const result = await globalThis.searchPresets.getAll()
      if (result.success && result.data) {
        set({ presets: result.data, loading: false })
      } else {
        set({ error: result.error?.message || 'Failed to load presets', loading: false })
        rendererLog.error('[SearchPresetsStore] Failed to load presets:', result.error)
      }
    } catch (error) {
      rendererLog.error('[SearchPresetsStore] Error loading presets:', error)
      set({ error: 'Failed to load presets', loading: false })
    }
  },

  // Create a new preset (or update if name exists due to backend upsert)
  createPreset: async (command) => {
    try {
      const result = await globalThis.searchPresets.create(command)
      if (result.success && result.data) {
        // Reload presets to get updated list
        await get().loadPresets()
        rendererLog.info('[SearchPresetsStore] Preset created/updated:', command.name)
        return result.data
      } else {
        rendererLog.error('[SearchPresetsStore] Failed to create preset:', result.error)
        set({ error: result.error?.message || 'Failed to create preset' })
        return null
      }
    } catch (error) {
      rendererLog.error('[SearchPresetsStore] Error creating preset:', error)
      set({ error: 'Failed to create preset' })
      return null
    }
  },

  // Delete a preset
  deletePreset: async (id) => {
    try {
      const result = await globalThis.searchPresets.delete(id)
      if (result.success) {
        // Remove from local state
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id)
        }))
        rendererLog.info('[SearchPresetsStore] Preset deleted:', id)
      } else {
        rendererLog.error('[SearchPresetsStore] Failed to delete preset:', result.error)
        set({ error: result.error?.message || 'Failed to delete preset' })
      }
    } catch (error) {
      rendererLog.error('[SearchPresetsStore] Error deleting preset:', error)
      set({ error: 'Failed to delete preset' })
    }
  },

  // Update lastUsedAt timestamp when preset is applied
  updateLastUsedAt: async (id) => {
    try {
      const result = await globalThis.searchPresets.updateLastUsedAt(id)
      if (result.success) {
        // Update local timestamp
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, lastUsedAt: new Date().toISOString() } : p
          )
        }))
      }
    } catch (error) {
      rendererLog.error('[SearchPresetsStore] Error updating lastUsedAt:', error)
    }
  },

  // Helper: Get preset by ID
  getPresetById: (id) => {
    return get().presets.find((p) => p.id === id)
  },

  // Helper: Get preset by name
  getPresetByName: (name) => {
    return get().presets.find((p) => p.name === name)
  }
}))
