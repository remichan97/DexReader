import React, { type JSX, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { ImageQuality } from '../../../../main/api/enums/image-quality.enum'
import { Button } from '@renderer/components/Button'
import { ProgressRing } from '@renderer/components/ProgressRing'
import {
  ArrowLeftRegular,
  Warning48Regular,
  BookRegular,
  EyeOff20Regular,
  Settings20Regular
} from '@fluentui/react-icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useAppStore } from '@renderer/stores'
import { ReaderSettingsModal } from '@renderer/components/ReaderSettingsModal'
import { ZoomControlsModal } from '@renderer/components/ZoomControlsModal'
import {
  useReaderSettings,
  usePagePairs,
  useReaderNavigation,
  useReaderKeyboard,
  useReaderZoom,
  useImagePreload,
  useChapterData,
  useProgressTracking
} from './hooks'
import { PageDisplay } from './components/PageDisplay'
import { DoublePageDisplay } from './components/DoublePageDisplay'
import { VerticalScrollDisplay } from './components/VerticalScrollDisplay'
import { EndOfChapterOverlay } from './components/EndOfChapterOverlay'
import './ReaderView.css'

/**
 * Reader state interface
 */
// Extract types from global window interface
/**
 * Chapter Entity type from MangaDex feed response
 */
export type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface ReaderState {
  // Navigation
  currentPage: number

  // UI state
  showChapterList: boolean
  zoomIndicatorVisible: boolean

  // Settings
  imageQuality: ImageQuality
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
  // Incognito mode
  readonly isIncognito: boolean
  // Reader settings
  readonly settingsPopover: React.ReactNode
  // Zoom controls popover
  readonly zoomControlsPopover: React.ReactNode
  // Reading mode info for page counter
  readonly readingMode: 'single' | 'double' | 'vertical'
  readonly currentPagePair?: [number] | [number, number]
  readonly readRightToLeft?: boolean
}

function ReaderHeader({
  chapterTitle,
  currentPage,
  totalPages,
  onBackClick,
  onToggleChapterList,
  showChapterList,
  isIncognito,
  settingsPopover,
  zoomControlsPopover,
  readingMode,
  currentPagePair,
  readRightToLeft
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
        {/* Reader settings popover */}
        {settingsPopover}
        {/* Zoom controls popover */}
        {zoomControlsPopover}

        <div className="reader-header__page-counter">
          {readingMode === 'double' && currentPagePair && currentPagePair.length === 2
            ? readRightToLeft
              ? `Page ${currentPagePair[1] + 1}-${currentPagePair[0] + 1}/${totalPages}`
              : `Page ${currentPagePair[0] + 1}-${currentPagePair[1] + 1}/${totalPages}`
            : `${currentPage + 1}/${totalPages}`}
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
          <Button onClick={onClose} size="small">
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
  const location = useLocation()

  // Progress tracking
  const saveProgress = useProgressStore((state) => state.saveProgress)
  const autoSaveEnabled = useProgressStore((state) => state.autoSaveEnabled)
  const toggleIncognito = useProgressStore((state) => state.toggleIncognito)

  // Get system theme
  const theme = useAppStore((state) => state.theme)

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
    currentPage: 0,
    showChapterList: false,
    zoomIndicatorVisible: false,
    imageQuality: ImageQuality.High, // High quality by default
    forceReaderDarkMode: true // Default to true for better reading experience, updated from settings on mount
  })

  const [showErrorDetails, setShowErrorDetails] = useState(false)

  // Ref to store zoom indicator timeout
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ========== CUSTOM HOOKS ==========

  // Chapter data hook (manages chapter loading, images, and metadata)
  const chapterData = useChapterData(
    mangaId,
    chapterId,
    locationState,
    location.key,
    state.imageQuality
  )

  // Reader settings hook (manages reading mode, double page settings, modal state)
  const {
    readingMode,
    doublePageSettings,
    showSettingsModal,
    toggleSettingsModal,
    handleSettingsChange: handleReaderSettingsChange
  } = useReaderSettings(mangaId || null)

  // Page pairs hook (generates page pairs for double page mode)
  const { pagePairs, currentPairIndex } = usePagePairs(
    chapterData.totalPages,
    state.currentPage,
    doublePageSettings.skipCoverPages,
    doublePageSettings.readRightToLeft,
    readingMode === 'double'
  )

  // Zoom/pan hook (manages zoom levels, fit modes, pan state)
  const zoom = useReaderZoom()

  // Navigation hook (page/chapter navigation)
  const navigation = useReaderNavigation(
    {
      mangaId: mangaId || null,
      mangaTitle: chapterData.mangaTitle,
      chapters: chapterData.chapters,
      readingMode,
      currentPage: state.currentPage,
      totalPages: chapterData.totalPages,
      currentPairIndex,
      pagePairs,
      previousChapter: chapterData.previousChapter,
      nextChapter: chapterData.nextChapter
    },
    (pageIndex) => {
      chapterData.setImageLoadingState(pageIndex, 'loading')
      setState((prev) => ({ ...prev, currentPage: pageIndex }))
    },
    () => {
      setState((prev) => ({ ...prev, showChapterList: false }))
    }
  )

  // Keyboard shortcuts hook
  useReaderKeyboard({
    readingMode,
    showChapterList: state.showChapterList,
    fitMode: zoom.fitMode,
    previousChapter: chapterData.previousChapter,
    nextChapter: chapterData.nextChapter,
    onToggleChapterList: () => {
      setState((prev) => ({ ...prev, showChapterList: !prev.showChapterList }))
    },
    navigationHandlers: navigation,
    zoomHandlers: {
      zoomIn: zoom.zoomIn,
      zoomOut: zoom.zoomOut,
      resetZoom: zoom.resetZoom,
      setFitMode: zoom.setFitMode
    }
  })

  // Image preload hook - manages preloading of adjacent pages
  useImagePreload(
    state.currentPage,
    chapterData.images.map((img) => img.url),
    chapterData.loading,
    chapterData.totalPages
  )

  // Progress tracking hook - manages auto-save and incognito mode
  useProgressTracking({
    mangaId,
    chapterId,
    chapterTitle: chapterData.chapterTitle,
    chapterNumber: chapterData.chapterNumber,
    mangaTitle: chapterData.mangaTitle,
    coverUrl: locationState?.coverUrl,
    currentPage: state.currentPage,
    totalPages: chapterData.totalPages,
    loading: chapterData.loading,
    error: chapterData.error,
    autoSaveEnabled,
    saveProgress,
    toggleIncognito
  })

  // ========== END CUSTOM HOOKS ==========

  // Load reader settings (forceDarkMode) on mount
  useEffect(() => {
    const loadReaderSettings = async (): Promise<void> => {
      try {
        const settingsResult = await globalThis.electron.ipcRenderer.invoke('settings:load')
        if (settingsResult.success && settingsResult.data?.reader?.forceDarkMode !== undefined) {
          setState((prev) => ({
            ...prev,
            forceReaderDarkMode: settingsResult.data.reader.forceDarkMode
          }))
        }
      } catch (error) {
        console.error('Failed to load reader settings:', error)
        // Keep default value on error
      }
    }

    loadReaderSettings()
  }, []) // Run once on mount

  // Update document title with reading information
  useEffect(() => {
    if (!chapterData.loading && !chapterData.error && chapterData.totalPages > 0) {
      const pageInfo = `Page ${state.currentPage + 1}/${chapterData.totalPages}`
      document.title = `${chapterData.mangaTitle} - ${chapterData.chapterTitle} - ${pageInfo} - DexReader`
    } else if (chapterData.loading) {
      document.title = 'Loading... - DexReader'
    } else {
      document.title = 'Reader - DexReader'
    }
  }, [
    chapterData.mangaTitle,
    chapterData.chapterTitle,
    state.currentPage,
    chapterData.totalPages,
    chapterData.loading,
    chapterData.error
  ])

  // Page pair generation now handled by usePagePairs hook
  // Image preloading now handled by useImagePreload hook

  // Navigation functions now provided by useReaderNavigation hook
  const { goToNextPage, goToPreviousPage, goToPreviousChapter, goToNextChapter, handleBackClick } =
    navigation

  /**
   * Toggle chapter list sidebar
   */
  const toggleChapterList = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      showChapterList: !prev.showChapterList
    }))
  }, [])

  // Settings and chapter navigation now provided by hooks
  // toggleSettingsModal and handleReaderSettingsChange from useReaderSettings hook
  // handleChapterClick from useReaderNavigation hook
  const handleChapterClick = navigation.handleChapterClick

  // Zoom/pan functions now provided by useReaderZoom hook
  // All zoom-related functions and state accessed via zoom object

  /**
   * Handle image click navigation
   * Left 40% = previous, Right 60% = next
   * Disabled when zoomed to avoid interfering with drag
   */
  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      // Don't navigate if zoomed in (to avoid interfering with drag)
      if (zoom.zoomLevel > 1) {
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
    [goToPreviousPage, goToNextPage, zoom.zoomLevel]
  )

  // Keyboard navigation now handled by useReaderKeyboard hook

  // Cleanup zoom indicator timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current)
      }
    }
  }, [])

  // Progress tracking now handled by useProgressTracking hook

  // Compute reader theme: use dark if EITHER forceDarkMode is on OR system theme is dark
  const readerTheme = state.forceReaderDarkMode || theme === 'dark' ? 'dark' : 'light'

  return (
    <main className="reader-view" data-theme={readerTheme}>
      {chapterData.loading && (
        <div className="reader-view__loading">
          <ProgressRing size="large" aria-label="Loading chapter" />
          <p className="reader-view__loading-text">Loading chapter...</p>
        </div>
      )}

      {chapterData.error && (
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
                onClick={() => chapterId && chapterData.loadChapterImages(chapterId)}
                disabled={chapterData.loading}
                loading={chapterData.loading}
                size="medium"
              >
                {chapterData.loading ? 'Retrying...' : 'Try Again'}
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
                  <strong>Error:</strong> {chapterData.error.message}
                </div>
                {chapterData.error.stack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: '1.4' }}>
                      {chapterData.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!chapterData.loading && !chapterData.error && chapterData.images.length > 0 && (
        <>
          <ReaderHeader
            chapterTitle={chapterData.chapterTitle}
            currentPage={state.currentPage}
            totalPages={chapterData.totalPages}
            onBackClick={handleBackClick}
            onToggleChapterList={toggleChapterList}
            showChapterList={state.showChapterList}
            isIncognito={!autoSaveEnabled}
            readingMode={readingMode as any}
            currentPagePair={
              readingMode === 'double' && pagePairs.length > 0
                ? pagePairs[currentPairIndex]
                : undefined
            }
            readRightToLeft={doublePageSettings.readRightToLeft}
            settingsPopover={
              <ReaderSettingsModal
                isOpen={showSettingsModal}
                onOpen={toggleSettingsModal}
                onClose={toggleSettingsModal}
                settings={{
                  readingMode: readingMode as any,
                  doublePageMode: {
                    skipCoverPages: doublePageSettings.skipCoverPages,
                    readRightToLeft: doublePageSettings.readRightToLeft
                  }
                }}
                onSettingsChange={handleReaderSettingsChange}
              >
                <Button
                  variant="ghost"
                  size="small"
                  icon={<Settings20Regular />}
                  aria-label="Reader settings"
                  title="Reader settings (reading mode)"
                >
                  Settings
                </Button>
              </ReaderSettingsModal>
            }
            zoomControlsPopover={
              <ZoomControlsModal
                isOpen={zoom.showZoomControls}
                onOpen={zoom.toggleZoomControls}
                onClose={zoom.toggleZoomControls}
                fitMode={zoom.fitMode}
                zoomLevel={zoom.zoomLevel}
                onFitWidth={() => zoom.setFitMode('width')}
                onFitHeight={() => zoom.setFitMode('height')}
                onActualSize={() => zoom.setFitMode('actual')}
                onZoomIn={zoom.zoomIn}
                onZoomOut={zoom.zoomOut}
                onReset={zoom.resetZoom}
              >
                <Button
                  variant="ghost"
                  size="small"
                  aria-label="Zoom controls"
                  title="Zoom controls (Z to cycle fit modes)"
                >
                  {Math.round(zoom.zoomLevel * 100)}%
                </Button>
              </ZoomControlsModal>
            }
          />

          {/* Render based on reading mode */}
          {readingMode === 'vertical' ? (
            <VerticalScrollDisplay
              images={chapterData.images}
              imageStates={chapterData.imageLoadingStates}
              currentPage={state.currentPage}
              onPageChange={(newPage) => {
                setState((prev) => ({ ...prev, currentPage: newPage }))
              }}
              onImageLoad={(pageIndex) => {
                chapterData.setImageLoadingState(pageIndex, 'loaded')
              }}
              onImageError={(pageIndex) => {
                chapterData.setImageLoadingState(pageIndex, 'error')
              }}
            />
          ) : readingMode === 'double' && pagePairs.length > 0 ? (
            <DoublePageDisplay
              images={chapterData.images}
              pagePair={pagePairs[currentPairIndex]}
              imageStates={chapterData.imageLoadingStates}
              fitMode={zoom.fitMode}
              onImageLoad={(pageIndex) => {
                chapterData.setImageLoadingState(pageIndex, 'loaded')
              }}
              onImageError={(pageIndex) => {
                chapterData.setImageLoadingState(pageIndex, 'error')
              }}
              onClick={handleImageClick}
              zoomLevel={zoom.zoomLevel}
              panX={zoom.panX}
              panY={zoom.panY}
              isDragging={zoom.isDragging}
              onMouseDown={zoom.onMouseDown}
              onMouseMove={zoom.onMouseMove}
              onMouseUp={zoom.onMouseUp}
              onWheel={zoom.handleWheel}
              transformOriginX={zoom.transformOriginX}
              transformOriginY={zoom.transformOriginY}
              onNavigateLeft={goToPreviousPage}
              onNavigateRight={goToNextPage}
              readRightToLeft={doublePageSettings.readRightToLeft}
            />
          ) : (
            <PageDisplay
              imageUrl={chapterData.images[state.currentPage].url}
              pageNumber={state.currentPage}
              totalPages={chapterData.totalPages}
              fitMode={zoom.fitMode}
              isLoading={chapterData.imageLoadingStates.get(state.currentPage) === 'loading'}
              hasError={chapterData.imageLoadingStates.get(state.currentPage) === 'error'}
              onImageLoad={() => {
                chapterData.setImageLoadingState(state.currentPage, 'loaded')
              }}
              onImageError={() => {
                chapterData.setImageLoadingState(state.currentPage, 'error')
              }}
              onClick={handleImageClick}
              zoomLevel={zoom.zoomLevel}
              panX={zoom.panX}
              panY={zoom.panY}
              isDragging={zoom.isDragging}
              onMouseDown={zoom.onMouseDown}
              onMouseMove={zoom.onMouseMove}
              onMouseUp={zoom.onMouseUp}
              onWheel={zoom.handleWheel}
              transformOriginX={zoom.transformOriginX}
              transformOriginY={zoom.transformOriginY}
              onNavigateLeft={goToPreviousPage}
              onNavigateRight={goToNextPage}
            />
          )}

          {/* Zoom indicator overlay (shown during Ctrl+Wheel zoom) */}
          {state.zoomIndicatorVisible && (
            <div className="zoom-indicator">
              <span className="zoom-indicator__percentage">
                {Math.round(zoom.zoomLevel * 100)}%
              </span>
            </div>
          )}

          {/* Show end of chapter overlay on last page */}
          {state.currentPage === chapterData.totalPages - 1 && (
            <EndOfChapterOverlay
              chapterTitle={chapterData.chapterTitle}
              chapterNumber={chapterData.chapterNumber}
              previousChapter={chapterData.previousChapter}
              nextChapter={chapterData.nextChapter}
              onPreviousChapter={goToPreviousChapter}
              onNextChapter={goToNextChapter}
              onBackToDetail={handleBackClick}
            />
          )}

          {/* Chapter list sidebar */}
          <ChapterListSidebar
            chapters={chapterData.chapters}
            currentChapterId={chapterData.chapterId || ''}
            isOpen={state.showChapterList}
            onClose={toggleChapterList}
            onChapterClick={handleChapterClick}
          />
        </>
      )}
    </main>
  )
}
