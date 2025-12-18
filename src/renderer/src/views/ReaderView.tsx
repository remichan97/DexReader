import type { JSX } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { ImageUrlResponse } from '../../../preload/index.d'
import { ImageQuality } from '../../../main/api/enums/image-quality.enum'
import { Button } from '@renderer/components/Button'
import { ProgressRing } from '@renderer/components/ProgressRing'
import {
  ArrowLeftRegular,
  Warning48Regular,
  BookRegular,
  EyeOff20Regular
} from '@fluentui/react-icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import './ReaderView.css'

/**
 * Reader state interface
 */
// Extract types from global window interface
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface ReaderState {
  // Chapter data
  chapterId: string | null
  mangaId: string | null
  images: ImageUrlResponse[]
  chapterTitle: string
  mangaTitle: string
  chapterNumber: string | null

  // Chapter navigation
  chapters: ChapterEntity[]
  chaptersLoading: boolean
  previousChapter: ChapterEntity | null
  nextChapter: ChapterEntity | null

  // Navigation
  currentPage: number
  totalPages: number

  // UI state
  loading: boolean
  error: Error | null
  imageLoadingStates: Map<number, 'loading' | 'loaded' | 'error'>
  showChapterList: boolean
  showZoomControls: boolean
  zoomIndicatorVisible: boolean

  // Settings
  imageQuality: ImageQuality
  fitMode: 'width' | 'height' | 'actual' | 'custom'
  forceReaderDarkMode: boolean // Whether to force dark theme for reader

  // Zoom/Pan state
  zoomLevel: number // 0.25 to 4.0 (25% to 400%)
  panX: number // X offset in pixels
  panY: number // Y offset in pixels
  isDragging: boolean
  dragStartX: number
  dragStartY: number
  transformOriginX: number // Transform origin X as percentage (0-100)
  transformOriginY: number // Transform origin Y as percentage (0-100)
}

/**
 * Zoom Controls Component
 */
interface ZoomControlsProps {
  readonly fitMode: 'width' | 'height' | 'actual' | 'custom'
  readonly zoomLevel: number
  readonly onFitWidth: () => void
  readonly onFitHeight: () => void
  readonly onActualSize: () => void
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onReset: () => void
}

function ZoomControls({
  fitMode,
  zoomLevel,
  onFitWidth,
  onFitHeight,
  onActualSize,
  onZoomIn,
  onZoomOut,
  onReset
}: ZoomControlsProps): JSX.Element {
  const zoomPercentage = Math.round(zoomLevel * 100)

  return (
    <div className="zoom-controls">
      {/* Fit mode buttons */}
      <div className="zoom-controls__fit-modes">
        <Button
          variant={fitMode === 'width' ? 'primary' : 'ghost'}
          size="small"
          onClick={onFitWidth}
          aria-label="Fit to width"
          title="Fit image to page width"
        >
          Width
        </Button>
        <Button
          variant={fitMode === 'height' ? 'primary' : 'ghost'}
          size="small"
          onClick={onFitHeight}
          aria-label="Fit to height"
          title="Fit image to page height"
        >
          Height
        </Button>
        <Button
          variant={fitMode === 'actual' ? 'primary' : 'ghost'}
          size="small"
          onClick={onActualSize}
          aria-label="Actual size"
          title="Show at 100% size (actual size)"
        >
          100%
        </Button>
      </div>

      {/* Zoom in/out buttons */}
      <div className="zoom-controls__zoom-buttons">
        <Button
          variant="ghost"
          size="small"
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.25}
          aria-label="Zoom out"
          title="Zoom out (Ctrl + -)"
        >
          −
        </Button>
        <span className="zoom-controls__level" title="Current zoom level">
          {zoomPercentage}%
        </span>
        <Button
          variant="ghost"
          size="small"
          onClick={onZoomIn}
          disabled={zoomLevel >= 4}
          aria-label="Zoom in"
          title="Zoom in (Ctrl + =)"
        >
          +
        </Button>
      </div>

      {/* Reset button */}
      <Button
        variant="ghost"
        size="small"
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset to default (fit to height)"
      >
        Reset
      </Button>
    </div>
  )
}

/**
 * Reader Header Component
 */
interface ReaderHeaderProps {
  readonly chapterTitle: string
  readonly currentPage: number
  readonly totalPages: number
  readonly onBackClick: () => void
  readonly onToggleChapterList: () => void
  readonly showChapterList: boolean
  // Zoom controls
  readonly fitMode: 'width' | 'height' | 'actual' | 'custom'
  readonly zoomLevel: number
  readonly showZoomControls: boolean
  readonly onToggleZoomControls: () => void
  readonly onFitWidth: () => void
  readonly onFitHeight: () => void
  readonly onActualSize: () => void
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onResetZoom: () => void
  // Incognito mode
  readonly isIncognito: boolean
}

function ReaderHeader({
  chapterTitle,
  currentPage,
  totalPages,
  onBackClick,
  onToggleChapterList,
  showChapterList,
  fitMode,
  zoomLevel,
  showZoomControls,
  onToggleZoomControls,
  onFitWidth,
  onFitHeight,
  onActualSize,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isIncognito
}: ReaderHeaderProps): JSX.Element {
  return (
    <header className="reader-header">
      <div className="reader-header__left">
        <Button variant="ghost" onClick={onBackClick} icon={<ArrowLeftRegular />} size="medium">
          Back
        </Button>
      </div>

      <h1 className="reader-header__title">{chapterTitle}</h1>

      <div className="reader-header__right">
        {/* Incognito mode indicator */}
        {isIncognito && (
          <div
            className="reader-header__incognito-badge"
            title="Progress tracking is disabled. Go to Settings or File menu to enable."
          >
            <EyeOff20Regular />
            <span>Incognito</span>
          </div>
        )}
        {/* Zoom controls toggle button */}
        <Button
          variant="ghost"
          size="small"
          onClick={onToggleZoomControls}
          aria-label={showZoomControls ? 'Hide zoom controls' : 'Show zoom controls'}
          title="Toggle zoom controls (Z to cycle fit modes)"
        >
          {Math.round(zoomLevel * 100)}%
        </Button>

        {showZoomControls && (
          <ZoomControls
            fitMode={fitMode}
            zoomLevel={zoomLevel}
            onFitWidth={onFitWidth}
            onFitHeight={onFitHeight}
            onActualSize={onActualSize}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onResetZoom}
          />
        )}

        <div className="reader-header__page-counter">
          <span className="reader-header__current-page">{currentPage + 1}</span>
          <span className="reader-header__separator">/</span>
          <span className="reader-header__total-pages">{totalPages}</span>
        </div>
        <Button
          variant="ghost"
          onClick={onToggleChapterList}
          icon={<BookRegular />}
          size="medium"
          aria-label={showChapterList ? 'Close chapter list' : 'Open chapter list'}
        >
          Chapters
        </Button>
      </div>
    </header>
  )
}

/**
 * Page Display Component
 */
interface PageDisplayProps {
  readonly imageUrl: string
  readonly pageNumber: number
  readonly totalPages: number
  readonly fitMode: 'width' | 'height' | 'actual' | 'custom'
  readonly isLoading: boolean
  readonly hasError: boolean
  readonly onImageLoad: () => void
  readonly onImageError: () => void
  readonly onClick: (e: React.MouseEvent<HTMLDivElement>) => void
  // Zoom/Pan props
  readonly zoomLevel: number
  readonly panX: number
  readonly panY: number
  readonly isDragging: boolean
  readonly onMouseDown: (e: React.MouseEvent) => void
  readonly onMouseMove: (e: React.MouseEvent) => void
  readonly onMouseUp: (e: React.MouseEvent) => void
  readonly onWheel: (e: React.WheelEvent) => void
  readonly transformOriginX: number
  readonly transformOriginY: number
  // Navigation handlers
  readonly onNavigateLeft: () => void
  readonly onNavigateRight: () => void
}

function PageDisplay({
  imageUrl,
  pageNumber,
  totalPages,
  fitMode,
  isLoading,
  hasError,
  onImageLoad,
  onImageError,
  onClick,
  zoomLevel,
  panX,
  panY,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  transformOriginX,
  transformOriginY,
  onNavigateLeft,
  onNavigateRight
}: PageDisplayProps): JSX.Element {
  // Calculate image transform style
  const getCursor = (): string => {
    if (fitMode === 'custom' || zoomLevel > 1) {
      return isDragging ? 'grabbing' : 'grab'
    }
    return 'default'
  }

  const imageStyle: React.CSSProperties = {
    transform:
      fitMode === 'custom'
        ? `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`
        : undefined,
    transformOrigin: `${transformOriginX}% ${transformOriginY}%`,
    cursor: getCursor(),
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  }

  return (
    <div className="reader-page-container">
      {isLoading && (
        <div className="reader-page-loading">
          <ProgressRing size="large" aria-label="Loading page" />
          <p className="reader-page-loading__text">
            Loading page {pageNumber + 1} of {totalPages}...
          </p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="reader-page-error">
          <p>Failed to load page {pageNumber + 1}</p>
          <p className="reader-page-error__hint">Try navigating to another page</p>
        </div>
      )}

      {!hasError && (
        <div
          className="reader-page"
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick(e as unknown as React.MouseEvent<HTMLDivElement>)
            }
          }}
          onWheel={onWheel}
          role="button"
          tabIndex={0}
          aria-label={`Page ${pageNumber + 1} of ${totalPages}. Click or use keyboard to navigate.`}
          style={{ display: isLoading ? 'none' : 'flex' }}
        >
          {/* Navigation indicators - clickable even when zoomed */}
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--left"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateLeft()
            }}
            aria-label="Previous page"
          >
            <span>◀</span>
          </button>
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--right"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateRight()
            }}
            aria-label="Next page"
          >
            <span>▶</span>
          </button>

          <img
            src={imageUrl}
            alt={`Page ${pageNumber + 1}`}
            className={`reader-page__image reader-page__image--fit-${fitMode === 'custom' ? 'height' : fitMode}`}
            style={imageStyle}
            onLoad={onImageLoad}
            onError={onImageError}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
      )}
    </div>
  )
}

/**
 * End of Chapter Overlay - Shows navigation options at the end of chapter
 */
interface EndOfChapterOverlayProps {
  readonly chapterTitle: string
  readonly chapterNumber: string | null
  readonly previousChapter: ChapterEntity | null
  readonly nextChapter: ChapterEntity | null
  readonly onPreviousChapter: () => void
  readonly onNextChapter: () => void
  readonly onBackToDetail: () => void
}

function EndOfChapterOverlay({
  chapterTitle,
  chapterNumber,
  previousChapter,
  nextChapter,
  onPreviousChapter,
  onNextChapter,
  onBackToDetail
}: EndOfChapterOverlayProps): JSX.Element {
  return (
    <div className="end-of-chapter-overlay">
      <div className="end-of-chapter-overlay__content">
        <h2 className="end-of-chapter-overlay__title">End of Chapter {chapterNumber}</h2>
        <p className="end-of-chapter-overlay__subtitle">{chapterTitle}</p>

        <div className="end-of-chapter-overlay__actions">
          {previousChapter && (
            <Button variant="secondary" size="large" onClick={onPreviousChapter}>
              <span>← Previous Chapter</span>
              <span className="end-of-chapter-overlay__chapter-info">
                Ch. {previousChapter.attributes.chapter}
                {previousChapter.attributes.title && `: ${previousChapter.attributes.title}`}
              </span>
            </Button>
          )}

          {nextChapter && (
            <Button variant="primary" size="large" onClick={onNextChapter}>
              <span>Next Chapter →</span>
              <span className="end-of-chapter-overlay__chapter-info">
                Ch. {nextChapter.attributes.chapter}
                {nextChapter.attributes.title && `: ${nextChapter.attributes.title}`}
              </span>
            </Button>
          )}

          {!nextChapter && !previousChapter && (
            <p className="end-of-chapter-overlay__no-chapters">No more chapters available</p>
          )}
        </div>

        <Button variant="ghost" onClick={onBackToDetail} className="end-of-chapter-overlay__back">
          Back to Manga Details
        </Button>
      </div>
    </div>
  )
}

/**
 * Chapter List Sidebar Component
 */
interface ChapterListSidebarProps {
  readonly chapters: ChapterEntity[]
  readonly currentChapterId: string
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onChapterClick: (chapterId: string) => void
}

function ChapterListSidebar({
  chapters,
  currentChapterId,
  isOpen,
  onClose,
  onChapterClick
}: ChapterListSidebarProps): JSX.Element {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="chapter-list-overlay"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close chapter list"
        />
      )}

      {/* Sidebar */}
      <aside className={`chapter-list-sidebar ${isOpen ? 'chapter-list-sidebar--open' : ''}`}>
        <header className="chapter-list-sidebar__header">
          <h2>Chapters</h2>
          <Button variant="ghost" onClick={onClose} size="small">
            Close
          </Button>
        </header>

        <div className="chapter-list-sidebar__content">
          {chapters.length === 0 ? (
            <p className="chapter-list-sidebar__empty">No chapters available</p>
          ) : (
            <ul className="chapter-list-sidebar__list">
              {chapters.map((chapter) => {
                const chapterNumber = chapter.attributes.chapter || 'N/A'
                const chapterTitle = chapter.attributes.title
                const ariaLabel = chapterTitle
                  ? `Chapter ${chapterNumber}: ${chapterTitle}`
                  : `Chapter ${chapterNumber}`

                return (
                  <li
                    key={chapter.id}
                    className={`chapter-list-sidebar__item ${
                      chapter.id === currentChapterId ? 'chapter-list-sidebar__item--active' : ''
                    }`}
                    onClick={() => onChapterClick(chapter.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onChapterClick(chapter.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={ariaLabel}
                    aria-current={chapter.id === currentChapterId ? 'true' : undefined}
                  >
                    <div className="chapter-list-sidebar__item-number">
                      Ch. {chapterNumber}
                      {chapter.attributes.volume && ` Vol. ${chapter.attributes.volume}`}
                    </div>
                    {chapterTitle && (
                      <div className="chapter-list-sidebar__item-title">{chapterTitle}</div>
                    )}
                    <div className="chapter-list-sidebar__item-meta">
                      {chapter.attributes.pages} pages
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

export function ReaderView(): JSX.Element {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Progress tracking
  const saveProgress = useProgressStore((state) => state.saveProgress)
  const autoSaveEnabled = useProgressStore((state) => state.autoSaveEnabled)
  const toggleIncognito = useProgressStore((state) => state.toggleIncognito)

  // Get chapter data from navigation state if available
  const locationState = location.state as {
    chapterNumber?: string
    chapterTitle?: string
    mangaTitle?: string
    coverUrl?: string // Cover image URL for progress tracking
    chapters?: ChapterEntity[] // Chapter list from detail view
    startAtLastPage?: boolean // Flag to start at last page (when navigating from previous chapter)
    startPage?: number // Page to start at (from Continue Reading)
  } | null

  const [state, setState] = useState<ReaderState>({
    chapterId: null,
    mangaId: null,
    images: [],
    chapterTitle: 'Loading chapter...',
    mangaTitle: locationState?.mangaTitle || 'Manga',
    chapterNumber: locationState?.chapterNumber || null,
    chapters: locationState?.chapters || [], // Use chapters from navigation state
    chaptersLoading: false,
    previousChapter: null,
    nextChapter: null,
    currentPage: 0,
    totalPages: 0,
    loading: true,
    error: null,
    imageLoadingStates: new Map(),
    showChapterList: false,
    showZoomControls: false,
    zoomIndicatorVisible: false,
    imageQuality: ImageQuality.High, // High quality by default
    fitMode: 'height',
    forceReaderDarkMode: true, // Force dark mode by default for better reading experience
    // Zoom/Pan defaults
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    transformOriginX: 50, // Center by default
    transformOriginY: 50 // Center by default
  })

  const [showErrorDetails, setShowErrorDetails] = useState(false)

  // Ref to store zoom indicator timeout
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track previous chapter state for completion detection
  const previousChapterRef = useRef<{ id: string; wasOnLastPage: boolean } | null>(null)

  /**
   * Load chapter images from API
   */
  const loadChapterImages = useCallback(
    async (id: string, startAtLastPage = false): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        // Fetch image URLs from at-home server (wrapped in IpcResponse)
        const response = await globalThis.window.mangadex.getChapterImages(id, state.imageQuality)

        // Check IPC response wrapper
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || "Couldn't load the chapter pages")
        }

        const imageUrls = response.data

        // Validate response data
        if (!imageUrls || imageUrls.length === 0) {
          throw new Error("This chapter doesn't have any pages. It might be empty or unavailable.")
        }

        // Convert URLs to proxy protocol (mangadex://)
        const images = imageUrls.map((img) => ({
          ...img,
          url: img.url.replace('https://', 'mangadex://')
        }))

        setState((prev) => {
          // Initialize loading states for all images, preserving any existing loaded/error states
          const loadingStates = new Map<number, 'loading' | 'loaded' | 'error'>()
          images.forEach((_, index) => {
            const existingState = prev.imageLoadingStates.get(index)
            // Keep existing state if it's loaded or error, otherwise set to loading
            loadingStates.set(index, existingState || 'loading')
          })

          // Determine starting page: 1) from startPage prop (Continue Reading), 2) from startAtLastPage flag, 3) default to 0
          const startPage = locationState?.startPage ?? (startAtLastPage ? images.length - 1 : 0)

          return {
            ...prev,
            images,
            totalPages: images.length,
            currentPage: startPage,
            loading: false,
            imageLoadingStates: loadingStates,
            chapterId: id,
            mangaId: mangaId || null
            // Note: chapterTitle and chapterNumber will be updated by the location state useEffect
          }
        })
      } catch (error) {
        console.error('Failed to load chapter images:', error)
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false
        }))
      }
    },
    [state.imageQuality, mangaId]
  )

  /**
   * Load chapter list for navigation
   */
  const loadChapterList = useCallback(
    async (mangaIdParam: string, currentChapterId: string): Promise<void> => {
      if (!mangaIdParam) return

      // If we already have chapters from navigation state, just determine adjacent chapters
      if (state.chapters.length > 0) {
        const currentIndex = state.chapters.findIndex((ch) => ch.id === currentChapterId)
        const previousChapter = currentIndex > 0 ? state.chapters[currentIndex - 1] : null
        const nextChapter =
          currentIndex < state.chapters.length - 1 ? state.chapters[currentIndex + 1] : null

        setState((prev) => ({
          ...prev,
          previousChapter,
          nextChapter
        }))
        return
      }

      // Fallback: Fetch chapters if not provided (shouldn't happen normally)
      setState((prev) => ({ ...prev, chaptersLoading: true }))

      try {
        const chaptersResponse = await globalThis.mangadex.getMangaFeed(mangaIdParam, {
          limit: 500,
          offset: 0,
          translatedLanguage: ['en'], // Fallback to English
          order: { chapter: 'asc' },
          includes: ['scanlation_group']
        })

        if (!chaptersResponse.success || !chaptersResponse.data) {
          console.warn('Failed to load chapter list for navigation')
          setState((prev) => ({ ...prev, chaptersLoading: false }))
          return
        }

        const chapters = chaptersResponse.data.data

        // Find current chapter index
        const currentIndex = chapters.findIndex((ch) => ch.id === currentChapterId)

        // Determine previous and next chapters
        const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
        const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

        setState((prev) => ({
          ...prev,
          chapters,
          chaptersLoading: false,
          previousChapter,
          nextChapter
        }))
      } catch (error) {
        console.error('Failed to load chapter list:', error)
        setState((prev) => ({ ...prev, chaptersLoading: false }))
      }
    },
    [state.chapters]
  )

  // Update state when chapterId or location changes (update from location state)
  useEffect(() => {
    if (chapterId) {
      if (locationState) {
        // Construct proper chapter title from location state
        let chapterTitle = 'Loading chapter...'
        const chapterNum = locationState.chapterNumber
        const title = locationState.chapterTitle

        if (chapterNum && title && title.trim()) {
          chapterTitle = `Chapter ${chapterNum}: ${title}`
        } else if (chapterNum) {
          chapterTitle = `Chapter ${chapterNum}`
        } else if (title && title.trim()) {
          chapterTitle = title
        }

        setState((prev) => ({
          ...prev,
          chapterTitle: chapterTitle,
          chapterNumber: locationState.chapterNumber || prev.chapterNumber,
          mangaTitle: locationState.mangaTitle || prev.mangaTitle,
          chapters: locationState.chapters || prev.chapters
        }))
      }
    }
  }, [chapterId, location.key]) // Use location.key to detect navigation changes

  // Fetch images on mount or chapterId change
  useEffect(() => {
    if (chapterId && mangaId) {
      const startAtLastPage = locationState?.startAtLastPage || false
      loadChapterImages(chapterId, startAtLastPage).then(() => {
        // Load chapter list for navigation after images are loaded
        loadChapterList(mangaId, chapterId)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, mangaId])

  // Update document title with reading information
  useEffect(() => {
    if (!state.loading && !state.error && state.totalPages > 0) {
      const pageInfo = `Page ${state.currentPage + 1}/${state.totalPages}`
      document.title = `${state.mangaTitle} - ${state.chapterTitle} - ${pageInfo} - DexReader`
    } else if (state.loading) {
      document.title = 'Loading... - DexReader'
    } else {
      document.title = 'Reader - DexReader'
    }
  }, [
    state.mangaTitle,
    state.chapterTitle,
    state.currentPage,
    state.totalPages,
    state.loading,
    state.error
  ])

  /**
   * Preload adjacent pages for smoother navigation
   * Preloads: 2 pages ahead, 1 page back
   */
  useEffect(() => {
    if (!state.loading && state.images.length > 0 && state.totalPages > 0) {
      // Only preload if current page is loaded or loading
      const currentPageState = state.imageLoadingStates.get(state.currentPage)
      if (!currentPageState || currentPageState === 'error') return

      // Determine which pages to preload
      const pagesToPreload = [
        state.currentPage - 1, // 1 page back
        state.currentPage + 1, // 1 page ahead
        state.currentPage + 2 // 2 pages ahead
      ]

      // Preload images for adjacent pages
      pagesToPreload.forEach((pageIndex) => {
        if (pageIndex >= 0 && pageIndex < state.totalPages) {
          const pageState = state.imageLoadingStates.get(pageIndex)
          // Only preload if not already loaded or loading
          if (!pageState || pageState === 'error') {
            const img = new Image()
            img.src = state.images[pageIndex].url

            // Update loading state
            setState((prev) => {
              const newStates = new Map(prev.imageLoadingStates)
              if (!newStates.get(pageIndex)) {
                newStates.set(pageIndex, 'loading')
              }
              return { ...prev, imageLoadingStates: newStates }
            })

            img.onload = () => {
              setState((prev) => {
                const newStates = new Map(prev.imageLoadingStates)
                newStates.set(pageIndex, 'loaded')
                return { ...prev, imageLoadingStates: newStates }
              })
            }

            img.onerror = () => {
              setState((prev) => {
                const newStates = new Map(prev.imageLoadingStates)
                newStates.set(pageIndex, 'error')
                return { ...prev, imageLoadingStates: newStates }
              })
            }
          }
        }
      })
    }
  }, [state.currentPage, state.images, state.loading, state.totalPages, state.imageLoadingStates])

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (pageIndex: number): void => {
      if (pageIndex < 0 || pageIndex >= state.totalPages) return

      setState((prev) => {
        const newStates = new Map(prev.imageLoadingStates)
        // Set new page to loading ONLY if it hasn't been loaded yet
        const currentState = newStates.get(pageIndex)
        if (!currentState || currentState === 'error') {
          newStates.set(pageIndex, 'loading')
        }
        return { ...prev, currentPage: pageIndex, imageLoadingStates: newStates }
      })

      // Scroll to top on page change
      globalThis.window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [state.totalPages]
  )

  /**
   * Navigate to next page
   */
  const goToNextPage = useCallback((): void => {
    if (state.currentPage < state.totalPages - 1) {
      goToPage(state.currentPage + 1)
    } else if (state.currentPage === state.totalPages - 1 && state.nextChapter && mangaId) {
      // At last page and next chapter exists - navigate to next chapter
      const chapter = state.nextChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle: state.mangaTitle,
          chapters: state.chapters,
          startAtLastPage: false // Start at first page of next chapter
        }
      })
    }
    // Otherwise stay on last page
  }, [
    state.currentPage,
    state.totalPages,
    state.nextChapter,
    state.mangaTitle,
    state.chapters,
    mangaId,
    goToPage,
    navigate
  ])

  /**
   * Navigate to previous page
   */
  const goToPreviousPage = useCallback((): void => {
    if (state.currentPage > 0) {
      goToPage(state.currentPage - 1)
    } else if (state.currentPage === 0 && state.previousChapter && mangaId) {
      // At first page and previous chapter exists - navigate to previous chapter's last page
      const chapter = state.previousChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle: state.mangaTitle,
          chapters: state.chapters,
          startAtLastPage: true // Flag to indicate we should start at the last page
        }
      })
    }
    // Otherwise stay on first page
  }, [
    state.currentPage,
    state.previousChapter,
    state.mangaTitle,
    state.chapters,
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
    goToPage(state.totalPages - 1)
  }, [state.totalPages, goToPage])

  /**
   * Handle back button click
   */
  const handleBackClick = useCallback((): void => {
    // Navigate to manga detail page to ensure proper title restoration
    if (mangaId) {
      navigate(`/browse/${mangaId}`)
    } else {
      navigate(-1)
    }
  }, [navigate, mangaId])

  /**
   * Navigate to previous chapter
   */
  const goToPreviousChapter = useCallback((): void => {
    if (state.previousChapter && mangaId) {
      const chapter = state.previousChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle: state.mangaTitle,
          chapters: state.chapters // Pass chapters for continued navigation
        }
      })
    }
  }, [state.previousChapter, state.mangaTitle, state.chapters, mangaId, navigate])

  /**
   * Navigate to next chapter
   */
  const goToNextChapter = useCallback((): void => {
    if (state.nextChapter && mangaId) {
      const chapter = state.nextChapter
      navigate(`/reader/${mangaId}/${chapter.id}`, {
        state: {
          chapterNumber: chapter.attributes.chapter,
          chapterTitle: chapter.attributes.title,
          mangaTitle: state.mangaTitle,
          chapters: state.chapters // Pass chapters for continued navigation
        }
      })
    }
  }, [state.nextChapter, state.mangaTitle, state.chapters, mangaId, navigate])

  /**
   * Toggle chapter list sidebar
   */
  const toggleChapterList = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      showChapterList: !prev.showChapterList
    }))
  }, [])

  /**
   * Toggle zoom controls visibility
   */
  const toggleZoomControls = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      showZoomControls: !prev.showZoomControls
    }))
  }, [])

  /**
   * Navigate to a specific chapter from the chapter list
   */
  const handleChapterClick = useCallback(
    (chapterId: string): void => {
      if (!mangaId) return

      // Find the selected chapter in the chapters array
      const selectedChapter = state.chapters.find((ch) => ch.id === chapterId)
      if (!selectedChapter) return

      // Close the sidebar
      setState((prev) => ({ ...prev, showChapterList: false }))

      // Navigate to the selected chapter with full chapter information
      navigate(`/reader/${mangaId}/${chapterId}`, {
        state: {
          chapterNumber: selectedChapter.attributes.chapter,
          chapterTitle: selectedChapter.attributes.title,
          mangaTitle: state.mangaTitle,
          chapters: state.chapters // Pass chapters for continued navigation
        }
      })
    },
    [mangaId, state.chapters, state.mangaTitle, navigate]
  )

  /**
   * Zoom/Pan Functions
   */

  /**
   * Set fit mode for image display
   */
  const setFitMode = useCallback((mode: 'width' | 'height' | 'actual' | 'custom'): void => {
    setState((prev) => ({
      ...prev,
      fitMode: mode,
      zoomLevel: mode === 'custom' ? prev.zoomLevel : 1,
      panX: 0, // Reset pan on fit mode change
      panY: 0
    }))
  }, [])

  /**
   * Zoom in (increase zoom level by 20%, max 400%)
   */
  const zoomIn = useCallback((): void => {
    setState((prev) => {
      const newZoom = Math.min(prev.zoomLevel * 1.2, 4) // Max 400%
      // If we're at exactly 100%, switch back to fit-height mode
      const newFitMode = Math.abs(newZoom - 1) < 0.01 ? 'height' : 'custom'
      return {
        ...prev,
        fitMode: newFitMode,
        zoomLevel: newZoom,
        panX: newFitMode === 'height' ? 0 : prev.panX,
        panY: newFitMode === 'height' ? 0 : prev.panY
      }
    })
  }, [])

  /**
   * Zoom out (decrease zoom level by 20%, min 25%)
   */
  const zoomOut = useCallback((): void => {
    setState((prev) => {
      const newZoom = Math.max(prev.zoomLevel / 1.2, 0.25) // Min 25%
      // If we're at exactly 100%, switch back to fit-height mode
      const newFitMode = Math.abs(newZoom - 1) < 0.01 ? 'height' : 'custom'
      return {
        ...prev,
        fitMode: newFitMode,
        zoomLevel: newZoom,
        panX: newFitMode === 'height' ? 0 : prev.panX,
        panY: newFitMode === 'height' ? 0 : prev.panY
      }
    })
  }, [])

  /**
   * Reset zoom to default (fit-height at 100%)
   */
  const resetZoom = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      fitMode: 'height',
      zoomLevel: 1,
      panX: 0,
      panY: 0
    }))
  }, [])

  /**
   * Handle mouse wheel zoom (Ctrl+Wheel)
   */
  const handleWheel = useCallback((e: React.WheelEvent): void => {
    if (!e.ctrlKey) return // Only zoom with Ctrl held

    e.preventDefault()

    // Calculate transform origin based on cursor position relative to the page container
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const originX = ((e.clientX - rect.left) / rect.width) * 100
    const originY = ((e.clientY - rect.top) / rect.height) * 100

    const delta = e.deltaY > 0 ? -0.1 : 0.1 // Zoom in/out
    setState((prev) => {
      const newZoom = Math.max(0.25, Math.min(4, prev.zoomLevel + delta))
      // If we're at exactly 100%, switch back to fit-height mode
      const newFitMode = Math.abs(newZoom - 1) < 0.01 ? 'height' : 'custom'
      return {
        ...prev,
        fitMode: newFitMode,
        zoomLevel: newZoom,
        transformOriginX: originX,
        transformOriginY: originY,
        panX: newFitMode === 'height' ? 0 : prev.panX,
        panY: newFitMode === 'height' ? 0 : prev.panY,
        zoomIndicatorVisible: true
      }
    })

    // Clear existing timeout
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current)
    }

    // Hide zoom indicator after 1.5 seconds of inactivity
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, zoomIndicatorVisible: false }))
      zoomIndicatorTimeoutRef.current = null
    }, 1500)
  }, [])

  /**
   * Constrain pan offsets to image boundaries
   */
  const constrainPan = useCallback((panX: number, panY: number): { x: number; y: number } => {
    // Get image and viewport dimensions
    const imgElement = document.querySelector('.reader-page__image') as HTMLImageElement
    if (!imgElement) return { x: 0, y: 0 }

    const rect = imgElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate boundaries (don't pan beyond image edges)
    const maxX = Math.max(0, (rect.width - viewportWidth) / 2)
    const maxY = Math.max(0, (rect.height - viewportHeight) / 2)

    return {
      x: Math.max(-maxX, Math.min(maxX, panX)),
      y: Math.max(-maxY, Math.min(maxY, panY))
    }
  }, [])

  /**
   * Handle mouse down for drag start
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      // Only allow drag in custom zoom mode or when image is larger than viewport
      if (state.fitMode !== 'custom' && state.zoomLevel === 1) return

      setState((prev) => ({
        ...prev,
        isDragging: true,
        dragStartX: e.clientX - prev.panX,
        dragStartY: e.clientY - prev.panY
      }))
    },
    [state.fitMode, state.zoomLevel]
  )

  /**
   * Handle mouse move for dragging
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent): void => {
      if (!state.isDragging) return

      const newPanX = e.clientX - state.dragStartX
      const newPanY = e.clientY - state.dragStartY
      const constrained = constrainPan(newPanX, newPanY)

      setState((prev) => ({
        ...prev,
        panX: constrained.x,
        panY: constrained.y
      }))
    },
    [state.isDragging, state.dragStartX, state.dragStartY, constrainPan]
  )

  /**
   * Handle mouse up/leave to end dragging
   */
  const handleMouseUp = useCallback((): void => {
    setState((prev) => ({ ...prev, isDragging: false }))
  }, [])

  /**
   * Handle image click navigation
   * Left 40% = previous, Right 60% = next
   * Disabled when in custom zoom mode to avoid interfering with drag
   */
  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      // Don't navigate if in custom zoom mode or if zoomed (to avoid interfering with drag)
      if (state.fitMode === 'custom' || state.zoomLevel > 1) {
        return
      }

      const clickX = e.clientX
      const windowWidth = globalThis.window.innerWidth

      // Left 40% = previous, Right 60% = next
      if (clickX < windowWidth * 0.4) {
        goToPreviousPage()
      } else {
        goToNextPage()
      }
    },
    [goToPreviousPage, goToNextPage, state.fitMode, state.zoomLevel]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Zoom shortcuts with Ctrl modifier
      if (e.ctrlKey) {
        if (e.key === '0') {
          e.preventDefault()
          resetZoom()
          return
        }
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          zoomIn()
          return
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault()
          zoomOut()
          return
        }
      }

      // Cycle through fit modes with 'Z' key
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        // Cycle: height → width → actual → height
        const modes = ['height', 'width', 'actual'] as const
        const currentIndex = modes.indexOf(state.fitMode as (typeof modes)[number])
        const nextMode = modes[(currentIndex + 1) % modes.length]
        setFitMode(nextMode)
        return
      }

      // Prevent default for navigation keys
      if (
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          ' ',
          'Home',
          'End',
          'Escape',
          'l',
          'L'
        ].includes(e.key)
      ) {
        e.preventDefault()
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
        case 'Enter':
          goToNextPage()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          goToPreviousPage()
          break
        case 'Home':
          goToFirstPage()
          break
        case 'End':
          goToLastPage()
          break
        case 'Escape':
          // If chapter list is open, close it, otherwise go back
          if (state.showChapterList) {
            toggleChapterList()
          } else {
            handleBackClick()
          }
          break
        case 'l':
        case 'L':
          toggleChapterList()
          break
      }
    }

    globalThis.window.addEventListener('keydown', handleKeyDown)
    return () => globalThis.window.removeEventListener('keydown', handleKeyDown)
  }, [
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    handleBackClick,
    toggleChapterList,
    state.showChapterList,
    state.fitMode,
    setFitMode,
    resetZoom,
    zoomIn,
    zoomOut
  ])

  // Cleanup zoom indicator timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current)
      }
    }
  }, [])

  // Auto-save progress on page change (debounced)
  useEffect(() => {
    // Skip if not reading or incognito mode active
    if (
      !autoSaveEnabled ||
      !mangaId ||
      !chapterId ||
      state.loading ||
      state.error ||
      state.totalPages === 0
    ) {
      return
    }

    // Debounce: wait 1 second after page change before saving
    const timer = setTimeout(() => {
      // Update ref to track if we're on last page (for potential completion on navigation)
      const isOnLastPage = state.currentPage === state.totalPages - 1
      previousChapterRef.current = { id: chapterId, wasOnLastPage: isOnLastPage }

      // Save current page progress (don't mark as complete yet)
      saveProgress({
        mangaId,
        mangaTitle: state.mangaTitle,
        coverUrl: locationState?.coverUrl,
        lastChapterId: chapterId,
        lastChapterNumber: state.chapterNumber ? Number(state.chapterNumber) : undefined,
        lastChapterTitle: state.chapterTitle,
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        markComplete: false
      })
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [
    state.currentPage,
    state.totalPages,
    state.mangaTitle,
    state.chapterTitle,
    state.chapterNumber,
    state.loading,
    state.error,
    mangaId,
    chapterId,
    autoSaveEnabled,
    saveProgress
  ])

  // Auto-save progress on chapter change (immediate, no debounce)
  useEffect(() => {
    // Skip if not reading or incognito mode active
    if (
      !autoSaveEnabled ||
      !mangaId ||
      !chapterId ||
      state.loading ||
      state.error ||
      state.totalPages === 0
    ) {
      return
    }

    // Check if previous chapter should be marked complete
    // Only mark complete if user finished (was on last page) AND navigated to different chapter
    const prevChapter = previousChapterRef.current
    const shouldMarkPreviousComplete =
      prevChapter && prevChapter.id !== chapterId && prevChapter.wasOnLastPage

    // If previous chapter should be marked complete, save it
    if (shouldMarkPreviousComplete && mangaId) {
      saveProgress({
        mangaId,
        mangaTitle: state.mangaTitle,
        coverUrl: locationState?.coverUrl,
        lastChapterId: prevChapter.id,
        lastChapterNumber: undefined, // We don't have this info for previous chapter
        lastChapterTitle: '',
        currentPage: 0, // Not relevant for completed chapters
        totalPages: 1, // Not relevant for completed chapters
        markComplete: true
      })
    }

    // Save progress for new chapter (starting at page 0, not complete)
    saveProgress({
      mangaId,
      mangaTitle: state.mangaTitle,
      coverUrl: locationState?.coverUrl,
      lastChapterId: chapterId,
      lastChapterNumber: state.chapterNumber ? Number(state.chapterNumber) : undefined,
      lastChapterTitle: state.chapterTitle,
      currentPage: 0,
      totalPages: state.totalPages,
      markComplete: false
    })

    // Update ref for new chapter
    previousChapterRef.current = { id: chapterId, wasOnLastPage: false }
  }, [
    chapterId,
    autoSaveEnabled,
    mangaId,
    state.loading,
    state.error,
    state.totalPages,
    state.mangaTitle,
    state.chapterNumber,
    state.chapterTitle,
    saveProgress
  ]) // Only trigger on chapter change

  // Auto-save progress on component unmount
  useEffect(() => {
    return () => {
      // Save progress on unmount if enabled
      if (
        autoSaveEnabled &&
        mangaId &&
        chapterId &&
        !state.loading &&
        !state.error &&
        state.totalPages > 0
      ) {
        // Don't mark as complete on unmount - user might return to this chapter
        // Only mark complete when navigating to another chapter
        saveProgress({
          mangaId,
          mangaTitle: state.mangaTitle,
          coverUrl: locationState?.coverUrl,
          lastChapterId: chapterId,
          lastChapterNumber: state.chapterNumber ? Number(state.chapterNumber) : undefined,
          lastChapterTitle: state.chapterTitle,
          currentPage: state.currentPage,
          totalPages: state.totalPages,
          markComplete: false
        })
      }
    }
    // Include all dependencies so cleanup captures current values
  }, [
    autoSaveEnabled,
    mangaId,
    chapterId,
    state.loading,
    state.error,
    state.totalPages,
    state.mangaTitle,
    state.chapterNumber,
    state.chapterTitle,
    state.currentPage,
    saveProgress
  ])

  // Listen for menu-triggered incognito toggle
  useEffect(() => {
    const handleIncognitoToggle = (): void => {
      toggleIncognito()
    }

    globalThis.progress.onIncognitoToggle(handleIncognitoToggle)
  }, [toggleIncognito])

  return (
    <main className="reader-view" data-theme={state.forceReaderDarkMode ? 'dark' : undefined}>
      {state.loading && (
        <div className="reader-view__loading">
          <ProgressRing size="large" aria-label="Loading chapter" />
          <p className="reader-view__loading-text">Loading chapter...</p>
        </div>
      )}

      {state.error && (
        <div className="reader-view__error">
          <div className="error-recovery">
            <div className="error-recovery__icon">
              <Warning48Regular />
            </div>
            <h3 className="error-recovery__title">Couldn&apos;t load this chapter</h3>
            <p className="error-recovery__message">
              We ran into a problem loading the pages for this chapter. This might be a temporary
              network hiccup, or the chapter data might not be available right now.
            </p>
            <div className="error-recovery__actions">
              <Button
                variant="primary"
                onClick={() => chapterId && loadChapterImages(chapterId)}
                disabled={state.loading}
                loading={state.loading}
                size="medium"
              >
                {state.loading ? 'Retrying...' : 'Try Again'}
              </Button>
              <Button variant="ghost" onClick={handleBackClick} size="medium">
                Go Back
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                size="medium"
              >
                {showErrorDetails ? 'Hide' : 'Show'} technical details
              </Button>
            </div>
            {showErrorDetails && (
              <div className="error-recovery__technical-details">
                <div>
                  <strong>Error:</strong> {state.error.message}
                </div>
                {state.error.stack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: '1.4' }}>
                      {state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!state.loading && !state.error && state.images.length > 0 && (
        <>
          <ReaderHeader
            chapterTitle={state.chapterTitle}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onBackClick={handleBackClick}
            onToggleChapterList={toggleChapterList}
            showChapterList={state.showChapterList}
            fitMode={state.fitMode}
            zoomLevel={state.zoomLevel}
            showZoomControls={state.showZoomControls}
            onToggleZoomControls={toggleZoomControls}
            onFitWidth={() => setFitMode('width')}
            onFitHeight={() => setFitMode('height')}
            onActualSize={() => setFitMode('actual')}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            isIncognito={!autoSaveEnabled}
          />

          <PageDisplay
            imageUrl={state.images[state.currentPage].url}
            pageNumber={state.currentPage}
            totalPages={state.totalPages}
            fitMode={state.fitMode}
            isLoading={state.imageLoadingStates.get(state.currentPage) === 'loading'}
            hasError={state.imageLoadingStates.get(state.currentPage) === 'error'}
            onImageLoad={() => {
              setState((prev) => {
                const newStates = new Map(prev.imageLoadingStates)
                newStates.set(prev.currentPage, 'loaded')
                return { ...prev, imageLoadingStates: newStates }
              })
            }}
            onImageError={() => {
              setState((prev) => {
                const newStates = new Map(prev.imageLoadingStates)
                newStates.set(prev.currentPage, 'error')
                return { ...prev, imageLoadingStates: newStates }
              })
            }}
            onClick={handleImageClick}
            zoomLevel={state.zoomLevel}
            panX={state.panX}
            panY={state.panY}
            isDragging={state.isDragging}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            transformOriginX={state.transformOriginX}
            transformOriginY={state.transformOriginY}
            onNavigateLeft={goToPreviousPage}
            onNavigateRight={goToNextPage}
          />

          {/* Zoom indicator overlay (shown during Ctrl+Wheel zoom) */}
          {state.zoomIndicatorVisible && (
            <div className="zoom-indicator">
              <span className="zoom-indicator__percentage">
                {Math.round(state.zoomLevel * 100)}%
              </span>
            </div>
          )}

          {/* Show end of chapter overlay on last page */}
          {state.currentPage === state.totalPages - 1 && (
            <EndOfChapterOverlay
              chapterTitle={state.chapterTitle}
              chapterNumber={state.chapterNumber}
              previousChapter={state.previousChapter}
              nextChapter={state.nextChapter}
              onPreviousChapter={goToPreviousChapter}
              onNextChapter={goToNextChapter}
              onBackToDetail={handleBackClick}
            />
          )}

          {/* Chapter list sidebar */}
          <ChapterListSidebar
            chapters={state.chapters}
            currentChapterId={state.chapterId || ''}
            isOpen={state.showChapterList}
            onClose={toggleChapterList}
            onChapterClick={handleChapterClick}
          />
        </>
      )}
    </main>
  )
}
