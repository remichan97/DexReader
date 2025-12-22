import { useEffect, useRef } from 'react'

interface ProgressData {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  lastChapterId: string
  lastChapterNumber?: number
  lastChapterTitle: string
  currentPage: number
  totalPages: number
  markComplete: boolean
}

interface UseProgressTrackingParams {
  // IDs
  mangaId: string | undefined
  chapterId: string | undefined

  // Chapter data
  chapterTitle: string
  chapterNumber: string | null
  mangaTitle: string
  coverUrl?: string

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
  chapterTitle,
  chapterNumber,
  mangaTitle,
  coverUrl,
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
      // Update ref to track if we're on last page (for potential completion on navigation)
      const isOnLastPage = currentPage === totalPages - 1
      previousChapterRef.current = { id: chapterId, wasOnLastPage: isOnLastPage }

      // Save current page progress (don't mark as complete yet)
      void saveProgress({
        mangaId,
        mangaTitle,
        coverUrl,
        lastChapterId: chapterId,
        lastChapterNumber: chapterNumber ? Number(chapterNumber) : undefined,
        lastChapterTitle: chapterTitle,
        currentPage,
        totalPages,
        markComplete: false
      })
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [
    currentPage,
    totalPages,
    mangaTitle,
    chapterTitle,
    chapterNumber,
    loading,
    error,
    mangaId,
    chapterId,
    autoSaveEnabled,
    saveProgress,
    coverUrl
  ])

  // Auto-save progress on chapter change (immediate, no debounce)
  useEffect(() => {
    // Skip if not reading or incognito mode active
    if (!autoSaveEnabled || !mangaId || !chapterId || loading || error || totalPages === 0) {
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
        mangaTitle,
        coverUrl,
        lastChapterId: prevChapter.id,
        lastChapterNumber: undefined, // We don't have this info for previous chapter
        lastChapterTitle: '',
        currentPage: 0, // Not relevant for completed chapters
        totalPages: 1, // Not relevant for completed chapters
        markComplete: true
      })
    }

    // Save progress for new chapter (starting at page 0, not complete)
    void saveProgress({
      mangaId,
      mangaTitle,
      coverUrl,
      lastChapterId: chapterId,
      lastChapterNumber: chapterNumber ? Number(chapterNumber) : undefined,
      lastChapterTitle: chapterTitle,
      currentPage: 0,
      totalPages,
      markComplete: false
    })

    // Update ref for new chapter
    previousChapterRef.current = { id: chapterId, wasOnLastPage: false }
  }, [
    chapterId,
    autoSaveEnabled,
    mangaId,
    loading,
    error,
    totalPages,
    mangaTitle,
    chapterNumber,
    chapterTitle,
    saveProgress,
    coverUrl
  ]) // Only trigger on chapter change

  // Auto-save progress on component unmount
  useEffect(() => {
    return () => {
      // Save progress on unmount if enabled
      if (autoSaveEnabled && mangaId && chapterId && !loading && !error && totalPages > 0) {
        // Don't mark as complete on unmount - user might return to this chapter
        // Only mark complete when navigating to another chapter
        void saveProgress({
          mangaId,
          mangaTitle,
          coverUrl,
          lastChapterId: chapterId,
          lastChapterNumber: chapterNumber ? Number(chapterNumber) : undefined,
          lastChapterTitle: chapterTitle,
          currentPage,
          totalPages,
          markComplete: false
        })
      }
    }
    // Include all dependencies so cleanup captures current values
  }, [
    autoSaveEnabled,
    mangaId,
    chapterId,
    loading,
    error,
    totalPages,
    mangaTitle,
    chapterNumber,
    chapterTitle,
    currentPage,
    saveProgress,
    coverUrl
  ])

  // Listen for menu-triggered incognito toggle
  useEffect(() => {
    const handleIncognitoToggle = (): void => {
      void toggleIncognito()
    }

    globalThis.progress.onIncognitoToggle(handleIncognitoToggle)
  }, [toggleIncognito])
}
