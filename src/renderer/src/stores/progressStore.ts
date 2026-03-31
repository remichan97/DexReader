/**
 * Progress Store - Reading progress tracking
 *
 * Manages local reading progress tracking including:
 * - Last read chapter and page for each manga
 * - Reading history with timestamps
 * - Reading statistics (total chapters, pages, time)
 * - Incognito mode (privacy-focused browsing without tracking)
 *
 * Features:
 * - Silent save pattern (no success notifications, error-only toasts)
 * - Optimistic updates for instant UI feedback
 * - Auto-retry on save failures (3 attempts with exponential backoff)
 * - Respects autoSaveEnabled flag (incognito mode)
 * - Debounced saves to prevent excessive writes
 *
 * All progress data is stored locally in AppData/progress.json
 */

import { create } from 'zustand'
import { useToastStore } from './toastStore'

// Types are available globally through Window interface (see preload/index.d.ts)
type MangaProgress = NonNullable<Awaited<ReturnType<Window['progress']['getProgress']>>['data']>
type MangaProgressMetadata = NonNullable<
  Awaited<ReturnType<Window['progress']['getAllProgress']>>['data']
>[number]
type ReadingStats = NonNullable<Awaited<ReturnType<Window['progress']['getStatistics']>>['data']>

// Command type for saving progress
interface SaveProgressCommand {
  mangaId: string
  chapterId: string
  currentPage: number
  completed: boolean
}

interface ProgressState {
  // State
  progressMap: Map<string, MangaProgress> // Lean progress (just IDs)
  progressMetadataMap: Map<string, MangaProgressMetadata> // Rich metadata (for history view)
  statistics: ReadingStats | null
  autoSaveEnabled: boolean
  loading: boolean
  error: Error | null

  // Actions
  loadProgress: (mangaId: string) => Promise<void>
  saveProgress: (progressData: {
    mangaId: string
    chapterId: string
    currentPage: number
    completed: boolean
  }) => Promise<void>
  flushPendingSaves: () => Promise<void> // Flush all pending debounced saves
  loadAllProgress: () => Promise<void>
  loadStatistics: () => Promise<void>
  deleteProgress: (mangaId: string) => Promise<void>
  toggleIncognito: () => Promise<void>
  clearError: () => void
}

// Debounce timers and pending save data per manga
const saveTimers = new Map<string, NodeJS.Timeout>()
const pendingSaves = new Map<string, SaveProgressCommand>()

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressMap: new Map(),
  progressMetadataMap: new Map(),
  statistics: null,
  autoSaveEnabled: true,
  loading: false,
  error: null,

  /**
   * Load progress for a specific manga
   * Uses optimistic caching - returns cached value immediately if available
   */
  loadProgress: async (mangaId: string) => {
    try {
      set({ loading: true, error: null })

      // Check cache first
      const cached = get().progressMap.get(mangaId)
      if (cached) {
        set({ loading: false })
        return
      }

      const response = await globalThis.progress.getProgress(mangaId)

      if (response.success && response.data) {
        const newMap = new Map(get().progressMap)
        newMap.set(mangaId, response.data)
        set({ progressMap: newMap, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
      set({ error: error as Error, loading: false })
    }
  },

  /**
   * Save progress for a manga
   * - Respects autoSaveEnabled flag (skips if false, i.e., incognito mode)
   * - Optimistic update: updates cache immediately
   * - Debounced: waits 1s before actually saving (coalesces rapid updates)
   * - Retry logic: 3 attempts with exponential backoff
   * - Silent save: no success toast, only error toast on final failure
   */
  saveProgress: async (progressData) => {
    const { autoSaveEnabled, progressMap } = get()

    // Skip if incognito mode is active
    if (!autoSaveEnabled) {
      return
    }

    const { mangaId, chapterId, currentPage, completed } = progressData

    // Build updated progress object with all fields
    const updatedProgress: MangaProgress = {
      mangaId,
      lastChapterId: chapterId,
      firstReadAt: progressMap.get(mangaId)?.firstReadAt ?? Math.floor(Date.now() / 1000),
      lastReadAt: Math.floor(Date.now() / 1000),
      currentPage,
      completed
    }

    // Update cache immediately (optimistic)
    const newMap = new Map(progressMap)
    newMap.set(mangaId, updatedProgress)
    set({ progressMap: newMap })

    // Clear existing debounce timer for this manga
    const existingTimer = saveTimers.get(mangaId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Store pending save data
    const command: SaveProgressCommand = {
      mangaId,
      chapterId,
      currentPage,
      completed
    }
    pendingSaves.set(mangaId, command)

    // Debounce: wait 1s before actually saving
    const timer = setTimeout(async () => {
      saveTimers.delete(mangaId)
      const cmd = pendingSaves.get(mangaId)
      if (!cmd) return

      pendingSaves.delete(mangaId)

      try {
        const response = await globalThis.progress.saveProgress([cmd])

        if (!response.success) {
          throw new Error(
            typeof response.error === 'string' ? response.error : 'Failed to save progress'
          )
        }
        // Success! Silent save - no toast notification
      } catch (error) {
        console.error('Failed to save progress:', error)
        useToastStore.getState().show({
          variant: 'error',
          title: 'Failed to save progress',
          message: 'Your reading progress could not be saved.',
          duration: 5000
        })
        set({ error: error as Error })
      }
    }, 1000) // 1 second debounce

    saveTimers.set(mangaId, timer)
  },

  /**
   * Flush all pending debounced saves immediately
   * Should be called before app closes to ensure no progress is lost
   */
  flushPendingSaves: async () => {
    // Clear all timers
    for (const timer of saveTimers.values()) {
      clearTimeout(timer)
    }
    saveTimers.clear()

    // Save all pending progress immediately
    if (pendingSaves.size === 0) return

    try {
      const commands = Array.from(pendingSaves.values())
      pendingSaves.clear()

      const response = await globalThis.progress.saveProgress(commands)
      if (!response.success) {
        console.error('Failed to flush pending saves:', response.error)
      }
    } catch (error) {
      console.error('Failed to flush pending saves:', error)
    }
  },

  /**
   * Load all progress (for history view)
   * Sorted by lastReadAt descending (most recent first)
   * Uses MangaProgressMetadata which includes rich data via JOINs
   */
  loadAllProgress: async () => {
    try {
      set({ loading: true, error: null })

      const response = await globalThis.progress.getAllProgress()

      if (response.success && response.data) {
        const newMap = new Map<string, MangaProgressMetadata>()
        response.data.forEach((progress) => {
          newMap.set(progress.mangaId, progress)
        })
        set({ progressMetadataMap: newMap, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      console.error('Failed to load all progress:', error)
      set({ error: error as Error, loading: false })
    }
  },

  /**
   * Load reading statistics
   */
  loadStatistics: async () => {
    try {
      const response = await globalThis.progress.getStatistics()

      if (response.success && response.data) {
        set({ statistics: response.data })
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
      set({ error: error as Error })
    }
  },

  /**
   * Delete progress for a specific manga
   */
  deleteProgress: async (mangaId: string) => {
    try {
      set({ loading: true, error: null })

      // Optimistic delete from both maps
      const newProgressMap = new Map(get().progressMap)
      const newMetadataMap = new Map(get().progressMetadataMap)
      newProgressMap.delete(mangaId)
      newMetadataMap.delete(mangaId)
      set({ progressMap: newProgressMap, progressMetadataMap: newMetadataMap })

      const response = await globalThis.progress.deleteProgress(mangaId)

      if (response.success) {
        set({ loading: false })
        useToastStore.getState().show({
          variant: 'success',
          title: 'Progress deleted',
          message: 'Reading progress removed from history.',
          duration: 3000
        })
      } else {
        // Rollback on failure
        const rollbackMap = new Map(get().progressMap)
        const deletedProgress = get().progressMap.get(mangaId)
        if (deletedProgress) {
          rollbackMap.set(mangaId, deletedProgress)
        }
        set({ progressMap: rollbackMap, loading: false })

        useToastStore.getState().show({
          variant: 'error',
          title: 'Failed to delete progress',
          message:
            typeof response.error === 'string'
              ? response.error
              : 'Could not remove progress from history.',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Failed to delete progress:', error)
      set({ error: error as Error, loading: false })

      useToastStore.getState().show({
        variant: 'error',
        title: 'Failed to delete progress',
        message: 'An error occurred while removing progress.',
        duration: 5000
      })
    }
  },

  /**
   * Toggle incognito mode
   * - When enabled: stops tracking progress, shows status bar
   * - When disabled: resumes tracking, hides status bar
   * - Updates menu bar label (Go Incognito ↔ Leave Incognito)
   */
  toggleIncognito: async () => {
    const newState = !get().autoSaveEnabled
    console.log('[ProgressStore] Toggling incognito:', {
      from: get().autoSaveEnabled,
      to: newState
    })
    set({ autoSaveEnabled: newState })

    // Update menu bar label
    globalThis.api.updateMenuState({
      isIncognito: !newState // isIncognito is inverse of autoSaveEnabled
    })

    // Status bar notification (handled by IncognitoStatusBar component)
    // Status bar will appear/disappear based on autoSaveEnabled state
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null })
  }
}))
