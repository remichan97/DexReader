import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReadingMode } from '@renderer/components/ReadingModeSelector'

type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface UseReaderNavigationProps {
  mangaId: string | null
  mangaTitle: string
  chapters: ChapterEntity[]
  readingMode: ReadingMode
  currentPage: number
  totalPages: number
  currentPairIndex: number
  pagePairs: Array<[number] | [number, number]>
  previousChapter: ChapterEntity | null
  nextChapter: ChapterEntity | null
}

interface UseReaderNavigationReturn {
  goToPage: (pageIndex: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToPreviousChapter: () => void
  goToNextChapter: () => void
  handleBackClick: () => void
  handleChapterClick: (chapterId: string) => void
}

/**
 * Custom hook for managing reader navigation (pages and chapters)
 * Handles page/chapter navigation for all reading modes
 */
export function useReaderNavigation(
  props: UseReaderNavigationProps,
  onPageChange: (pageIndex: number) => void,
  onChapterListClose: () => void
): UseReaderNavigationReturn {
  const navigate = useNavigate()

  const {
    mangaId,
    mangaTitle,
    chapters,
    readingMode,
    currentPage,
    totalPages,
    currentPairIndex,
    pagePairs,
    previousChapter,
    nextChapter
  } = props

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (pageIndex: number): void => {
      if (pageIndex < 0 || pageIndex >= totalPages) return

      onPageChange(pageIndex)

      // Scroll to top on page change
      globalThis.window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [totalPages, onPageChange]
  )

  /**
   * Navigate to next page (mode-aware)
   */
  const goToNextPage = useCallback((): void => {
    if (readingMode === 'double' && pagePairs.length > 0) {
      // Double page mode: navigate by pairs
      if (currentPairIndex < pagePairs.length - 1) {
        const nextPair = pagePairs[currentPairIndex + 1]
        goToPage(nextPair[0]) // Go to first page of next pair
      } else if (currentPairIndex === pagePairs.length - 1 && nextChapter && mangaId) {
        // At last pair and next chapter exists
        const chapter = nextChapter
        navigate(`/reader/${mangaId}/${chapter.id}`, {
          state: {
            chapterNumber: chapter.attributes.chapter,
            chapterTitle: chapter.attributes.title,
            mangaTitle,
            chapters,
            startAtLastPage: false
          }
        })
      }
    } else if (currentPage < totalPages - 1) {
      // Single page mode: navigate to next page
      goToPage(currentPage + 1)
    } else if (currentPage === totalPages - 1 && nextChapter && mangaId) {
      // At last page: navigate to next chapter
      const chapter = nextChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle,
          chapters,
          startAtLastPage: false
        }
      })
    }
  }, [
    readingMode,
    currentPage,
    totalPages,
    currentPairIndex,
    pagePairs,
    nextChapter,
    mangaTitle,
    chapters,
    mangaId,
    goToPage,
    navigate
  ])

  /**
   * Navigate to previous page (mode-aware)
   */
  const goToPreviousPage = useCallback((): void => {
    if (readingMode === 'double' && pagePairs.length > 0) {
      // Double page mode: navigate by pairs
      if (currentPairIndex > 0) {
        const prevPair = pagePairs[currentPairIndex - 1]
        goToPage(prevPair[0]) // Go to first page of previous pair
      } else if (currentPairIndex === 0 && previousChapter && mangaId) {
        // At first pair and previous chapter exists
        const chapter = previousChapter
        navigate(`/reader/${mangaId}/${chapter.id}`, {
          state: {
            chapterNumber: chapter.attributes.chapter,
            chapterTitle: chapter.attributes.title,
            mangaTitle,
            chapters,
            startAtLastPage: true
          }
        })
      }
    } else if (currentPage > 0) {
      // Single page mode: navigate to previous page
      goToPage(currentPage - 1)
    } else if (currentPage === 0 && previousChapter && mangaId) {
      // At first page: navigate to previous chapter
      const chapter = previousChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle,
          chapters,
          startAtLastPage: true
        }
      })
    }
  }, [
    readingMode,
    currentPage,
    currentPairIndex,
    pagePairs,
    previousChapter,
    mangaTitle,
    chapters,
    mangaId,
    goToPage,
    navigate
  ])

  /**
   * Navigate to first page
   */
  const goToFirstPage = useCallback((): void => {
    goToPage(0)
  }, [goToPage])

  /**
   * Navigate to last page
   */
  const goToLastPage = useCallback((): void => {
    goToPage(totalPages - 1)
  }, [totalPages, goToPage])

  /**
   * Navigate to previous chapter
   */
  const goToPreviousChapter = useCallback((): void => {
    if (previousChapter && mangaId) {
      const chapter = previousChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle,
          chapters
        }
      })
    }
  }, [previousChapter, mangaTitle, chapters, mangaId, navigate])

  /**
   * Navigate to next chapter
   */
  const goToNextChapter = useCallback((): void => {
    if (nextChapter && mangaId) {
      const chapter = nextChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle,
          chapters
        }
      })
    }
  }, [nextChapter, mangaTitle, chapters, mangaId, navigate])

  /**
   * Handle back button click
   */
  const handleBackClick = useCallback((): void => {
    if (mangaId) {
      navigate(`/browse/${mangaId}`)
    } else {
      navigate(-1)
    }
  }, [navigate, mangaId])

  /**
   * Navigate to a specific chapter from the chapter list
   */
  const handleChapterClick = useCallback(
    (chapterId: string): void => {
      if (!mangaId) return

      const selectedChapter = chapters.find((ch) => ch.id === chapterId)
      if (!selectedChapter) return

      onChapterListClose()

      navigate(`/reader/${mangaId}/${chapterId}`, {
        state: {
          chapterNumber: selectedChapter.attributes.chapter,
          chapterTitle: selectedChapter.attributes.title,
          mangaTitle,
          chapters
        }
      })
    },
    [mangaId, chapters, mangaTitle, navigate, onChapterListClose]
  )

  return {
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousChapter,
    goToNextChapter,
    handleBackClick,
    handleChapterClick
  }
}
