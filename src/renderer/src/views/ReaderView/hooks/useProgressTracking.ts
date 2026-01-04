import { useEffect, useRef } from 'react'

interface ProgressData {
  mangaId: string
  chapterId: string
  currentPage: number
  completed: boolean
}

interface UseProgressTrackingParams {
  // IDs
  mangaId: string | undefined
  chapterId: string | undefined

  // Page info
  currentPage: number
  totalPages: number

  // Loading states
  loading: boolean
  error: Error | null

  // Progress tracking functions
  autoSaveEnabled: boolean
  saveProgress: (data: ProgressData) => Promise<void>
  toggleIncognito: () => Promise<void>
}

/**
 * Custom hook for managing reading progress tracking and auto-save
 * Handles:
 * - Auto-save on page change (debounced)
 * - Auto-save on chapter change (immediate)
 * - Auto-save on unmount
 * - Chapter completion tracking
 * - Incognito mode toggle listener
 */
export function useProgressTracking({
  mangaId,
  chapterId,
  currentPage,
  totalPages,
  loading,
  error,
  autoSaveEnabled,
  saveProgress,
  toggleIncognito
}: UseProgressTrackingParams): void {
  // Track previous chapter state for completion detection
  const previousChapterRef = useRef<{ id: string; wasOnLastPage: boolean } | null>(null)

  // Auto-save progress on page change (debounced)
  useEffect(() => {
    // Skip if not reading or incognito mode active
    if (!autoSaveEnabled || !mangaId || !chapterId || loading || error || totalPages === 0) {
      return
    }

    // Debounce: wait 1 second after page change before saving
    const timer = setTimeout(() => {
      // Check if chapter is completed (on last page)
      const isOnLastPage = currentPage === totalPages - 1
      const completed = isOnLastPage

      // Update ref to track if we're on last page (for potential completion on navigation)
      previousChapterRef.current = { id: chapterId, wasOnLastPage: isOnLastPage }

      // Save current page progress
      void saveProgress({
        mangaId,
        chapterId,
        currentPage,
        completed
      })
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [currentPage, totalPages, loading, error, mangaId, chapterId, autoSaveEnabled, saveProgress])

  // Auto-save progress on chapter change (immediate, no debounce)
  useEffect(() => {
    // Skip if not ready
    if (!autoSaveEnabled || !mangaId || !chapterId || totalPages === 0) {
      return
    }

    // Check if previous chapter should be marked complete
    // Only mark complete if user finished (was on last page) AND navigated to different chapter
    const prevChapter = previousChapterRef.current
    const shouldMarkPreviousComplete =
      prevChapter && prevChapter.id !== chapterId && prevChapter.wasOnLastPage

    // If previous chapter should be marked complete, save it
    if (shouldMarkPreviousComplete && mangaId) {
      void saveProgress({
        mangaId,
        chapterId: prevChapter.id,
        currentPage: totalPages - 1, // Last page
        completed: true
      })
    }

    // Only save initial progress if this is actually a new chapter
    // (Don't reset progress when retrying after errors)
    if (!prevChapter || prevChapter.id !== chapterId) {
      // Save progress for new chapter (starting at page 0, not complete)
      void saveProgress({
        mangaId,
        chapterId,
        currentPage: 0,
        completed: false
      })
    }

    // Update ref for new chapter
    previousChapterRef.current = { id: chapterId, wasOnLastPage: false }
  }, [chapterId, autoSaveEnabled, mangaId, totalPages, saveProgress]) // Only trigger on actual chapter change

  // Auto-save progress on component unmount
  useEffect(() => {
    return () => {
      // Save progress on unmount if enabled
      if (autoSaveEnabled && mangaId && chapterId && !loading && !error && totalPages > 0) {
        // Don't mark as complete on unmount - user might return to this chapter
        // Only mark complete when navigating to another chapter
        void saveProgress({
          mangaId,
          chapterId,
          currentPage,
          completed: false
        })
      }
    }
    // Include all dependencies so cleanup captures current values
  }, [autoSaveEnabled, mangaId, chapterId, loading, error, totalPages, currentPage, saveProgress])

  // Listen for menu-triggered incognito toggle
  useEffect(() => {
    const handleIncognitoToggle = (): void => {
      void toggleIncognito()
    }

    globalThis.progress.onIncognitoToggle(handleIncognitoToggle)
  }, [toggleIncognito])
}
