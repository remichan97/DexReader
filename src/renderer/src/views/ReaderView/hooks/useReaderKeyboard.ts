import { useEffect } from 'react'
import type { ReadingMode } from '@renderer/components/ReadingModeSelector'

type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]
type FitMode = 'width' | 'height' | 'actual' | 'custom'

interface NavigationHandlers {
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToPreviousChapter: () => void
  goToNextChapter: () => void
  handleBackClick: () => void
}

interface ZoomHandlers {
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setFitMode: (mode: FitMode) => void
}

interface UseReaderKeyboardProps {
  readingMode: ReadingMode
  showChapterList: boolean
  fitMode: FitMode
  previousChapter: ChapterEntity | null
  nextChapter: ChapterEntity | null
  onToggleChapterList: () => void
  navigationHandlers: NavigationHandlers
  zoomHandlers: ZoomHandlers
}

/**
 * Custom hook for managing reader keyboard shortcuts
 * Handles all keyboard interactions in the reader
 */
export function useReaderKeyboard(props: UseReaderKeyboardProps): void {
  const {
    readingMode,
    showChapterList,
    fitMode,
    previousChapter,
    nextChapter,
    onToggleChapterList,
    navigationHandlers,
    zoomHandlers
  } = props

  useEffect(() => {
    const handleZoomShortcuts = (e: KeyboardEvent): boolean => {
      if (!e.ctrlKey) return false

      if (e.key === '0') {
        e.preventDefault()
        zoomHandlers.resetZoom()
        return true
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomHandlers.zoomIn()
        return true
      } else if (e.key === '-') {
        e.preventDefault()
        zoomHandlers.zoomOut()
        return true
      }
      return false
    }

    const handleFitModeShortcut = (e: KeyboardEvent): boolean => {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        const fitModes: FitMode[] = ['width', 'height', 'actual', 'custom']
        const currentIndex = fitModes.indexOf(fitMode)
        const nextIndex = (currentIndex + 1) % fitModes.length
        zoomHandlers.setFitMode(fitModes[nextIndex])
        return true
      }
      return false
    }

    const handleVerticalModeShortcuts = (e: KeyboardEvent): boolean => {
      if (readingMode !== 'vertical') return false

      if (e.key === ' ') {
        e.preventDefault()
        if (e.shiftKey) {
          navigationHandlers.goToPreviousPage()
        } else {
          navigationHandlers.goToNextPage()
        }
        return true
      }
      return false
    }

    const handleNavigationShortcuts = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case 'Enter':
          // In vertical mode, allow native scrolling with arrow keys
          if (readingMode !== 'vertical') {
            e.preventDefault()
            navigationHandlers.goToNextPage()
          }
          break

        case 'ArrowLeft':
        case 'PageUp':
          // In vertical mode, allow native scrolling with arrow keys
          if (readingMode !== 'vertical') {
            e.preventDefault()
            navigationHandlers.goToPreviousPage()
          }
          break

        case ' ':
          e.preventDefault()
          if (e.shiftKey) {
            navigationHandlers.goToPreviousPage()
          } else {
            navigationHandlers.goToNextPage()
          }
          break

        case 'Home':
          e.preventDefault()
          navigationHandlers.goToFirstPage()
          break

        case 'End':
          e.preventDefault()
          navigationHandlers.goToLastPage()
          break

        case 'Escape':
          e.preventDefault()
          if (showChapterList) {
            onToggleChapterList()
          } else {
            navigationHandlers.handleBackClick()
          }
          break

        case 'l':
        case 'L':
          e.preventDefault()
          onToggleChapterList()
          break

        case 'ArrowUp':
          if (previousChapter) {
            e.preventDefault()
            navigationHandlers.goToPreviousChapter()
          }
          break

        case 'ArrowDown':
          if (nextChapter) {
            e.preventDefault()
            navigationHandlers.goToNextChapter()
          }
          break

        default:
          break
      }
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Try handling zoom shortcuts first
      if (handleZoomShortcuts(e)) return

      // Try handling fit mode shortcuts
      if (handleFitModeShortcut(e)) return

      // Try handling vertical mode shortcuts
      if (handleVerticalModeShortcuts(e)) return

      // Handle navigation shortcuts
      handleNavigationShortcuts(e)
    }

    globalThis.window.addEventListener('keydown', handleKeyDown)

    return (): void => {
      globalThis.window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    readingMode,
    showChapterList,
    fitMode,
    previousChapter,
    nextChapter,
    onToggleChapterList,
    navigationHandlers,
    zoomHandlers
  ])
}
