import React, { type JSX, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ImageQuality } from '../../../../main/api/enums/image-quality.enum'
import type { MangaReadingSettings } from '../../../../preload/index.d'
import { Button } from '@renderer/components/Button'
import { LoadingState } from '@renderer/components/LoadingState'
import { ErrorState } from '@renderer/components/ErrorState'
import { Settings20Regular } from '@fluentui/react-icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useAppStore } from '@renderer/stores'
import { ReaderSettingsModal } from '@renderer/components/ReaderSettingsModal'
import { ZoomControlsModal } from '@renderer/components/ZoomControlsModal'
import { type StreamSource } from '@renderer/components/StreamSourceIndicator'
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
import { ReaderHeader } from './components/ReaderHeader'
import { ChapterListSidebar, type ChapterEntity } from './components/ChapterListSidebar'
import './ReaderView.css'

/**
 * Reader state interface
 */
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

export function ReaderView(): JSX.Element {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

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
    currentPage: locationState?.startPage ?? 0, // Start from saved progress if available
    showChapterList: false,
    zoomIndicatorVisible: false,
    imageQuality: ImageQuality.High, // High quality by default
    forceReaderDarkMode: true // Default to true for better reading experience, updated from settings on mount
  })

  const [streamSource, setStreamSource] = useState<StreamSource>('online')

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

  // Check if current chapter is downloaded
  useEffect(() => {
    if (!chapterId) return

    const checkDownloadStatus = async (): Promise<void> => {
      try {
        const result = await globalThis.downloads.isDownloaded(chapterId)
        if (result.success && result.data) {
          setStreamSource('local')
        } else {
          setStreamSource('online')
        }
      } catch (error) {
        console.error('Failed to check download status:', error)
        setStreamSource('online') // Default to online on error
      }
    }

    checkDownloadStatus()
  }, [chapterId]) // Re-check when chapter changes

  // Cache chapters to database when chapters are available
  useEffect(() => {
    if (mangaId && locationState?.chapters && locationState.chapters.length > 0) {
      const chaptersToSave = locationState.chapters.map((ch) => {
        // Get scanlation group from relationships
        const scanlationGroup = ch.relationships.find((r) => r.type === 'scanlation_group')

        return {
          chapterId: ch.id,
          mangaId: mangaId,
          title: ch.attributes.title || undefined,
          chapterNumber: ch.attributes.chapter || undefined,
          volume: ch.attributes.volume || undefined,
          language: ch.attributes.translatedLanguage,
          publishAt: new Date(ch.attributes.publishAt),
          scanlationGroup: scanlationGroup?.attributes?.name || undefined,
          externalUrl: ch.attributes.externalUrl || undefined
        }
      })

      // Save chapters in background (non-blocking)
      void globalThis.progress.saveChapters(chaptersToSave)
    }
  }, [mangaId, locationState?.chapters])

  // Reset page when chapter changes
  useEffect(() => {
    if (chapterId) {
      // Determine starting page based on location state
      let startPage = 0

      if (locationState?.startAtLastPage && chapterData.totalPages > 0) {
        // Start at last page when navigating from previous chapter
        startPage = chapterData.totalPages - 1
      } else if (locationState?.startPage !== undefined) {
        // Start at specified page (from Continue Reading)
        startPage = locationState.startPage
      }

      // Ensure page is within bounds
      if (startPage >= chapterData.totalPages && chapterData.totalPages > 0) {
        startPage = 0
      }

      setState((prev) => ({ ...prev, currentPage: startPage }))
    }
  }, [chapterId, locationState?.startAtLastPage, locationState?.startPage, chapterData.totalPages])

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
    const timeoutId = zoomIndicatorTimeoutRef.current
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  // Progress tracking now handled by useProgressTracking hook

  // Compute reader theme: use dark if EITHER forceDarkMode is on OR system theme is dark
  const readerTheme = state.forceReaderDarkMode || theme === 'dark' ? 'dark' : 'light'

  return (
    <main className="reader-view flex flex-col" data-theme={readerTheme}>
      {chapterData.loading && (
        <div className="reader-view__loading flex flex-col items-center justify-center">
          <LoadingState message="Loading chapter..." />
        </div>
      )}

      {chapterData.error && (
        <div className="reader-view__error flex flex-col items-center justify-center">
          {(() => {
            const isOfflineError =
              chapterData.error.message.toLowerCase().includes('offline') ||
              chapterData.error.message.toLowerCase().includes('downloaded')

            return isOfflineError ? (
              <ErrorState
                variant="offline"
                title="You're offline"
                message={chapterData.error.message}
                secondaryAction={{
                  label: 'Go to Library',
                  onClick: () => navigate('/library')
                }}
              />
            ) : (
              <ErrorState
                title="Couldn't load this chapter"
                message="We ran into a problem loading the pages for this chapter. This might be a temporary network hiccup, or the chapter data might not be available right now."
                error={chapterData.error}
                onRetry={() => chapterId && chapterData.loadChapterImages(chapterId)}
                retrying={chapterData.loading}
                secondaryAction={{
                  label: 'Go Back',
                  onClick: handleBackClick
                }}
                showTechnicalDetails={true}
              />
            )
          })()}
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
            readingMode={readingMode}
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
                  readingMode: readingMode as MangaReadingSettings['readingMode'],
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
            streamSource={streamSource}
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
              imageUrl={chapterData.images[state.currentPage]?.url || ''}
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
