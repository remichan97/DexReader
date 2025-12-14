import type { JSX } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import type { ImageUrlResponse } from '../../../preload/index.d'
import { ImageQuality } from '../../../main/api/enums/image-quality.enum'
import { Button } from '@renderer/components/Button'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { ArrowLeftRegular, Warning48Regular, BookRegular } from '@fluentui/react-icons'
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

  // Settings
  imageQuality: ImageQuality
  fitMode: 'width' | 'height' | 'actual'
  forceReaderDarkMode: boolean // Whether to force dark theme for reader
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
}

function ReaderHeader({
  chapterTitle,
  currentPage,
  totalPages,
  onBackClick,
  onToggleChapterList,
  showChapterList
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
  readonly fitMode: 'width' | 'height' | 'actual'
  readonly isLoading: boolean
  readonly hasError: boolean
  readonly onImageLoad: () => void
  readonly onImageError: () => void
  readonly onClick: (e: React.MouseEvent<HTMLDivElement>) => void
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
  onClick
}: PageDisplayProps): JSX.Element {
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
          role="button"
          tabIndex={0}
          aria-label={`Page ${pageNumber + 1} of ${totalPages}. Click or use keyboard to navigate.`}
          style={{ display: isLoading ? 'none' : 'flex' }}
        >
          {/* Navigation indicators */}
          <div
            className="reader-page__nav-indicator reader-page__nav-indicator--left"
            aria-hidden="true"
          >
            <span>◀</span>
          </div>
          <div
            className="reader-page__nav-indicator reader-page__nav-indicator--right"
            aria-hidden="true"
          >
            <span>▶</span>
          </div>

          <img
            src={imageUrl}
            alt={`Page ${pageNumber + 1}`}
            className={`reader-page__image reader-page__image--fit-${fitMode}`}
            onLoad={onImageLoad}
            onError={onImageError}
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

  // Get chapter data from navigation state if available
  const locationState = location.state as {
    chapterNumber?: string
    chapterTitle?: string
    mangaTitle?: string
    chapters?: ChapterEntity[] // Chapter list from detail view
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
    imageQuality: ImageQuality.High, // High quality by default
    fitMode: 'height',
    forceReaderDarkMode: true // Force dark mode by default for better reading experience
  })

  const [showErrorDetails, setShowErrorDetails] = useState(false)

  /**
   * Load chapter images from API
   */
  const loadChapterImages = useCallback(
    async (id: string): Promise<void> => {
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

          return {
            ...prev,
            images,
            totalPages: images.length,
            currentPage: 0,
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
      loadChapterImages(chapterId).then(() => {
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
    }
    // At last page - stay on last page for now
  }, [state.currentPage, state.totalPages, goToPage])

  /**
   * Navigate to previous page
   */
  const goToPreviousPage = useCallback((): void => {
    if (state.currentPage > 0) {
      goToPage(state.currentPage - 1)
    }
  }, [state.currentPage, goToPage])

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
   * Handle image click navigation
   * Left 40% = previous, Right 60% = next
   */
  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      const clickX = e.clientX
      const windowWidth = globalThis.window.innerWidth

      // Left 40% = previous, Right 60% = next
      if (clickX < windowWidth * 0.4) {
        goToPreviousPage()
      } else {
        goToNextPage()
      }
    },
    [goToPreviousPage, goToNextPage]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
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
    state.showChapterList
  ])

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
          />

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
