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
type ReadingStats = NonNullable<Awaited<ReturnType<Window['progress']['getStatistics']>>['data']>

interface ProgressState {
  // State
  progressMap: Map<string, MangaProgress>
  statistics: ReadingStats | null
  autoSaveEnabled: boolean
  loading: boolean
  error: Error | null

  // Actions
  loadProgress: (mangaId: string) => Promise<void>
  saveProgress: (progressData: {
    mangaId: string
    mangaTitle: string
    coverUrl?: string // Optional cover image URL
    lastChapterId: string
    lastChapterNumber?: number
    lastChapterTitle: string
    currentPage: number
    totalPages: number
    markComplete?: boolean // Optional flag to mark chapter as complete
  }) => Promise<void>
  loadAllProgress: () => Promise<void>
  loadStatistics: () => Promise<void>
  deleteProgress: (mangaId: string) => Promise<void>
  toggleIncognito: () => Promise<void>
  clearError: () => void
}

// Debounce timers per manga
const saveTimers = new Map<string, NodeJS.Timeout>()

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressMap: new Map(),
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

    const {
      mangaId,
      lastChapterId,
      currentPage,
      totalPages,
      markComplete = false,
      coverUrl
    } = progressData

    // Get existing progress to preserve other chapters
    const existingProgress = progressMap.get(mangaId)
    const existingChapters = existingProgress?.chapters || {}

    // Update current chapter progress
    const updatedChapters = {
      ...existingChapters,
      [lastChapterId]: {
        currentPage,
        totalPages,
        lastReadAt: Date.now(),
        completed: markComplete || (existingChapters[lastChapterId]?.completed ?? false)
      }
    }

    // Build updated progress object
    const updatedProgress: MangaProgress = {
      mangaId,
      mangaTitle: progressData.mangaTitle,
      coverUrl: coverUrl ?? existingProgress?.coverUrl ?? '',
      lastChapterId,
      lastChapterNumber: progressData.lastChapterNumber,
      lastChapterTitle: progressData.lastChapterTitle,
      firstReadAt: existingProgress?.firstReadAt ?? Date.now(),
      lastReadAt: Date.now(),
      chapters: updatedChapters
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

    // Debounce: wait 1s before actually saving
    const timer = setTimeout(async () => {
      saveTimers.delete(mangaId)

      // Retry logic
      let lastError: Error | null = null
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await globalThis.progress.saveProgress([updatedProgress])

          if (response.success) {
            // Success! Silent save - no toast notification
            return
          } else {
            lastError = new Error(
              typeof response.error === 'string' ? response.error : 'Unknown error'
            )
          }
        } catch (error) {
          lastError = error as Error
        }

        // Wait before retrying (exponential backoff)
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
        }
      }

      // All retries failed - show error toast
      if (lastError) {
        console.error('Failed to save progress after retries:', lastError)
        useToastStore.getState().show({
          variant: 'error',
          title: 'Failed to save progress',
          message: 'Your reading progress could not be saved. Please try again later.',
          duration: 5000
        })
        set({ error: lastError })
      }
    }, 1000) // 1 second debounce

    saveTimers.set(mangaId, timer)
  },

  /**
   * Load all progress (for history view)
   * Sorted by lastReadAt descending (most recent first)
   */
  loadAllProgress: async () => {
    try {
      set({ loading: true, error: null })

      const response = await globalThis.progress.getAllProgress()

      if (response.success && response.data) {
        const newMap = new Map<string, MangaProgress>()
        response.data.forEach((progress) => {
          newMap.set(progress.mangaId, progress)
        })
        set({ progressMap: newMap, loading: false })
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

      // Optimistic delete
      const newMap = new Map(get().progressMap)
      newMap.delete(mangaId)
      set({ progressMap: newMap })

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
