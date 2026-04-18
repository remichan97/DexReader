import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeftRegular, Warning48Regular, CloudOff48Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Skeleton } from '@renderer/components/Skeleton'
import { InfoBar } from '@renderer/components/InfoBar'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { getMangaTitle } from '@renderer/utils/mangaHelpers'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import MangaHeroSection from './components/MangaHeroSection'
import DescriptionSection from './components/DescriptionSection'
import ExternalLinksSection from './components/ExternalLinksSection'
import AlternativeTitlesSection from './components/AlternativeTitlesSection'
import ChapterList from './components/ChapterList'
import './MangaDetailView.css'
import type {
  ChapterProgress,
  MangaWithMetadata,
  ChapterWithMetadata
} from '../../../../preload/index.d'
import { rendererLog } from '@renderer/services/logging.service'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

interface MangaDetailViewState {
  manga: MangaEntity | null
  chapters: ChapterEntity[]
  loading: boolean
  error: Error | null
  selectedLanguage: string
  chapterSort: 'asc' | 'desc'
  chaptersLoading: boolean
  chaptersError: Error | null
  progress: NonNullable<Awaited<ReturnType<Window['progress']['getProgress']>>['data']> | null
  chapterProgress: Map<
    string,
    NonNullable<Awaited<ReturnType<Window['progress']['getAllChapterProgress']>>['data']>[number]
  >
  usingCachedData: boolean // Flag to indicate we're showing database cache instead of live API data
}

/**
 * MangaDetailView - Comprehensive manga detail page
 *
 * Displays full manga information including cover, description, tags,
 * and complete chapter list with filtering and sorting.
 *
 * Uses database-first approach: Always checks database cache first,
 * then fetches from API if online to update the cache.
 */
export function MangaDetailView(): JSX.Element {
  const { mangaId } = useParams<{ mangaId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [state, setState] = useState<MangaDetailViewState>({
    manga: null,
    chapters: [],
    loading: true,
    error: null,
    selectedLanguage: 'en',
    chapterSort: 'asc',
    chaptersLoading: false,
    chaptersError: null,
    progress: null,
    chapterProgress: new Map(),
    usingCachedData: false
  })
  const [showMainErrorDetails, setShowMainErrorDetails] = useState<boolean>(false)
  const [showChapterErrorDetails, setShowChapterErrorDetails] = useState<boolean>(false)
  const [showStickyTitle, setShowStickyTitle] = useState<boolean>(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Progress tracking
  const loadProgress = useProgressStore((state) => state.loadProgress)
  const progressMap = useProgressStore((state) => state.progressMap)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Load manga details and chapters on mount
  useEffect(() => {
    if (!mangaId) {
      navigate('/browse')
      return
    }

    // Always load manga data (database first, then API if online)
    loadMangaDetails(mangaId)

    // Load progress for this manga
    loadProgress(mangaId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId])

  // Update state when progress changes
  useEffect(() => {
    if (mangaId) {
      const progress = progressMap.get(mangaId)
      setState((prev) => ({ ...prev, progress: progress || null }))
    }
  }, [mangaId, progressMap])

  // Refresh progress when navigating back to this view (e.g., from reader)
  useEffect(() => {
    if (mangaId && location.pathname === `/browse/${mangaId}`) {
      // Reload manga progress and all chapter progress
      void loadProgress(mangaId)
      void loadChapterProgress(mangaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Load chapter progress on mount
  useEffect(() => {
    if (mangaId) {
      void loadChapterProgress(mangaId)
    }
  }, [mangaId])

  // Update document title with manga name
  useEffect(() => {
    if (state.manga) {
      const mangaTitle = getMangaTitle(state.manga)
      document.title = `${mangaTitle} - DexReader`
    } else if (state.loading) {
      document.title = 'Loading... - DexReader'
    } else {
      document.title = 'Manga Details - DexReader'
    }
  }, [state.manga, state.loading, mangaId]) // Include mangaId to force update on navigation

  // Handle scroll to show/hide sticky title
  useEffect(() => {
    const handleScroll = (): void => {
      if (scrollContainerRef.current) {
        // Show title when scrolled more than 300px (past hero section)
        setShowStickyTitle(scrollContainerRef.current.scrollTop > 300)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
    return undefined // Explicit return for no cleanup
  }, [state.manga])

  // Retry loading when coming back online if there was an offline error
  useEffect(() => {
    if (isOnline && state.error?.message.toLowerCase().includes('offline')) {
      if (mangaId) {
        loadMangaDetails(mangaId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, mangaId])

  /**
   * Load chapter progress for all chapters of this manga
   */
  const loadChapterProgress = async (id: string): Promise<void> => {
    try {
      const response = await globalThis.progress.getAllChapterProgress(id)
      if (response.success && response.data) {
        // Convert array to map for easy lookup
        const progressMap = new Map<string, ChapterProgress>(
          response.data.map((p) => [p.chapterId, p])
        )
        setState((prev) => ({ ...prev, chapterProgress: progressMap }))
      }
    } catch (error) {
      rendererLog.error('[MangaDetailView] Failed to load chapter progress:', error)
    }
  }

  /**
   * Convert database MangaWithMetadata to API MangaEntity format for display
   * This creates a minimal manga entity that can be displayed in degraded mode
   */
  const convertDbToMangaEntity = (dbManga: MangaWithMetadata): MangaEntity => {
    // Create a minimal manga entity structure
    return {
      id: dbManga.mangaId,
      type: 'manga',
      attributes: {
        title: { en: dbManga.title },
        altTitles: [],
        description: dbManga.description ? { en: dbManga.description } : {},
        isLocked: false,
        links: dbManga.externalLinks || {},
        originalLanguage: 'ja',
        lastVolume: dbManga.lastVolume,
        lastChapter: dbManga.lastChapter,
        publicationDemographic: null,
        status: dbManga.status,
        year: dbManga.year,
        contentRating: 'safe',
        latestUploadedChapter: null,
        tags: [],
        state: 'published',
        chapterNumbersResetOnNewVolume: false,
        createdAt: new Date().toISOString(),
        updatedAt: dbManga.updatedAt.toISOString(),
        version: 1,
        availableTranslatedLanguages: []
      },
      relationships: [
        ...(dbManga.coverUrl
          ? [
              {
                id: 'cached-cover',
                type: 'cover_art' as const,
                attributes: { fileName: dbManga.coverUrl.split('/').pop() || '' }
              }
            ]
          : []),
        ...dbManga.authors.map((author, index) => ({
          id: `cached-author-${index}`,
          type: 'author' as const,
          attributes: { name: author }
        })),
        ...dbManga.artists.map((artist, index) => ({
          id: `cached-artist-${index}`,
          type: 'artist' as const,
          attributes: { name: artist }
        }))
      ]
    } as MangaEntity
  }

  /**
   * Convert database ChapterWithMetadata[] to API ChapterEntity[] format
   */
  const convertDbToChapterEntities = (dbChapters: ChapterWithMetadata[]): ChapterEntity[] => {
    return dbChapters.map(
      (ch) =>
        ({
          id: ch.chapterId,
          type: 'chapter',
          attributes: {
            title: ch.title,
            volume: ch.volume,
            chapter: ch.chapterNumber,
            pages: 0,
            translatedLanguage: ch.language,
            uploader: 'unknown',
            externalUrl: ch.externalUrl,
            version: 1,
            createdAt: ch.createdAt.toISOString(),
            updatedAt: ch.updatedAt.toISOString(),
            publishAt: ch.publishedAt.toISOString(),
            readableAt: ch.publishedAt.toISOString(),
            isUnavailable: false
          },
          relationships: ch.scanlatorGroup
            ? [
                {
                  id: 'cached-group',
                  type: 'scanlation_group' as const,
                  attributes: { name: ch.scanlatorGroup }
                }
              ]
            : []
        }) as ChapterEntity
    )
  }

  /**
   * Fetch manga details from database first, then from API if online
   * Database-first approach ensures offline functionality with cached data
   */
  const loadMangaDetails = async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    // Step 1: Always check database first (works offline and online)
    let foundInDb = false
    try {
      const [dbMangaResult, dbChaptersResult] = await Promise.all([
        globalThis.library.getMangaById(id),
        globalThis.library.getCachedChapters(id)
      ])

      if (dbMangaResult.success && dbMangaResult.data) {
        foundInDb = true
        const dbManga = dbMangaResult.data
        const dbChapters = dbChaptersResult.success ? dbChaptersResult.data || [] : []

        // Convert database data to display format
        const mangaEntity = convertDbToMangaEntity(dbManga)
        const chapterEntities = convertDbToChapterEntities(dbChapters)

        // Determine language from cached chapters
        const languages = [...new Set(dbChapters.map((ch) => ch.language))].filter(
          (lang): lang is string => typeof lang === 'string'
        )
        const initialLanguage = languages.includes('en')
          ? 'en'
          : languages.length > 0
            ? languages[0]
            : 'en'

        // Update state with cached data
        setState((prev) => ({
          ...prev,
          manga: mangaEntity,
          chapters: chapterEntities,
          selectedLanguage: initialLanguage,
          loading: false,
          usingCachedData: !isOnline, // Only show cached data indicator if offline
          chaptersLoading: false,
          chaptersError: null
        }))

        // If we have downloads, show appropriate message
        if (!isOnline && dbManga.hasDownloads) {
          console.log(
            `Showing cached data for ${dbManga.title} (${dbManga.downloadedChapterCount} downloads)`
          )
        }
      }
    } catch (dbError) {
      console.warn('Failed to load from database:', dbError)
    }

    // Step 2: If online, fetch from API to update (works in background if we have DB data)
    if (isOnline) {
      try {
        const mangaResponse = await globalThis.mangadex.getManga(id, [
          'cover_art',
          'author',
          'artist'
        ])

        if (!mangaResponse.success || !mangaResponse.data) {
          throw new Error(mangaResponse.error?.message || 'Failed to fetch manga')
        }

        if (mangaResponse.data.result === 'error') {
          throw new Error('Failed to fetch manga from API')
        }

        const manga = mangaResponse.data.data

        // Cache to database for future offline use
        try {
          await cacheMangaMetadata(manga)
        } catch (cacheError) {
          console.warn('Failed to cache manga metadata:', cacheError)
        }

        // Get available languages
        const availableLanguages =
          (manga.attributes as { availableTranslatedLanguages?: string[] })
            .availableTranslatedLanguages || []
        const initialLanguage = availableLanguages.includes('en')
          ? 'en'
          : availableLanguages[0] || 'en'

        // Update state with live API data
        setState((prev) => ({
          ...prev,
          manga,
          selectedLanguage: initialLanguage,
          loading: false,
          usingCachedData: false,
          chaptersLoading: true,
          chaptersError: null
        }))

        // Fetch chapters
        try {
          const chaptersResponse = await globalThis.mangadex.getMangaFeed(id, {
            limit: 100,
            offset: 0,
            translatedLanguage: [initialLanguage],
            order: { chapter: 'asc' },
            includes: ['scanlation_group']
          })

          if (chaptersResponse.success && chaptersResponse.data.result !== 'error') {
            setState((prev) => ({
              ...prev,
              chapters: chaptersResponse.data.data,
              chaptersLoading: false,
              chaptersError: null
            }))
          }
        } catch (chapterError) {
          rendererLog.error('[MangaDetailView] Failed to load chapters:', chapterError)
          setState((prev) => ({
            ...prev,
            chaptersLoading: false,
            chaptersError:
              chapterError instanceof Error ? chapterError : new Error(String(chapterError))
          }))
        }
      } catch (apiError) {
        // Only show API error if we don't have database data
        if (!foundInDb) {
          rendererLog.error('[MangaDetailView] Failed to load manga from API:', apiError)
          setState((prev) => ({
            ...prev,
            error: apiError instanceof Error ? apiError : new Error(String(apiError)),
            loading: false
          }))
        } else {
          console.warn('API fetch failed, continuing with cached data:', apiError)
          // Keep cached data, just log the warning
        }
      }
    } else if (!foundInDb) {
      // Offline and no database cache - show error
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error("You're offline and this manga isn't cached. Go online to view it.")
      }))
    }
  }

  /**
   * Load chapters for a specific language
   */
  const loadChaptersForLanguage = async (language: string): Promise<void> => {
    if (!mangaId) return

    if (!isOnline) {
      setState((prev) => ({
        ...prev,
        chaptersLoading: false,
        chaptersError: new Error(
          "You're offline. Changing language or refreshing chapters requires an internet connection."
        )
      }))
      return
    }

    setState((prev) => ({ ...prev, chaptersLoading: true, chaptersError: null }))

    try {
      const chaptersResponse = await globalThis.mangadex.getMangaFeed(mangaId, {
        limit: 100,
        offset: 0,
        translatedLanguage: [language],
        order: { chapter: state.chapterSort },
        includes: ['scanlation_group']
      })

      // Check IPC success
      if (!chaptersResponse.success || !chaptersResponse.data) {
        throw new Error(chaptersResponse.error?.message || 'Failed to fetch chapters')
      }

      // Check API result
      if (chaptersResponse.data.result === 'error') {
        throw new Error('Failed to fetch chapters from API')
      }

      setState((prev) => ({
        ...prev,
        chapters: chaptersResponse.data.data,
        selectedLanguage: language,
        chaptersLoading: false,
        chaptersError: null,
        usingCachedData: false // Clear cached data flag when getting fresh data
      }))
    } catch (error) {
      rendererLog.error('[MangaDetailView] Failed to load chapters for language:', error)
      setState((prev) => ({
        ...prev,
        chapters: [],
        chaptersLoading: false,
        chaptersError: error instanceof Error ? error : new Error(String(error))
      }))
    }
  }

  /**
   * Handle back button click
   */
  const handleBackClick = (): void => {
    navigate('/browse')
  }

  /**
   * Handle retry after error
   */
  const handleRetry = (): void => {
    if (mangaId) {
      loadMangaDetails(mangaId)
    }
  }

  // Render loading state
  if (state.loading) {
    return <MangaDetailSkeleton />
  }

  // Render error state
  if (state.error) {
    const isOfflineError = state.error.message.toLowerCase().includes('offline')

    return (
      <div className="manga-detail-view flex flex-col">
        <div className="manga-detail-view__back-button">
          <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
            Back
          </Button>
        </div>
        <div className="manga-detail-error flex flex-col items-center justify-center">
          <div className="error-recovery flex flex-col items-center gap-3">
            <div className="error-recovery__icon">
              {isOfflineError ? <CloudOff48Regular /> : <Warning48Regular />}
            </div>
            <h3 className="error-recovery__title">
              {isOfflineError ? "You're offline" : "Couldn't load this manga"}
            </h3>
            <p className="error-recovery__message">
              {isOfflineError
                ? state.error.message
                : 'Something went wrong while trying to fetch this manga. It might be unavailable, deleted, or there could be a connection issue.'}
            </p>
            <div className="error-recovery__actions flex gap-2">
              {isOfflineError ? (
                <Button variant="primary" onClick={() => navigate('/library')}>
                  Go to Library
                </Button>
              ) : (
                <>
                  <Button variant="primary" onClick={handleRetry}>
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowMainErrorDetails(!showMainErrorDetails)}
                  >
                    {showMainErrorDetails ? 'Hide' : 'Show'} technical details
                  </Button>
                </>
              )}
            </div>
            {!isOfflineError && showMainErrorDetails && state.error && (
              <div className="error-recovery__technical-details">
                <div>
                  <strong>Error:</strong> {state.error.message}
                </div>
                {state.error.stack && (
                  <div className="mt-2">
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
      </div>
    )
  }

  // Render manga not found
  if (!state.manga) {
    return (
      <div className="manga-detail-view flex flex-col">
        <div className="manga-detail-view__back-button">
          <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
            Back
          </Button>
        </div>
        <div className="manga-detail-error flex flex-col items-center justify-center">
          <h2>Manga Not Found</h2>
          <p>This manga doesn&apos;t exist or has been removed.</p>
          <Button variant="accent" onClick={() => navigate('/browse')}>
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="manga-detail-view flex flex-col" ref={scrollContainerRef}>
      {/* Back button with optional sticky title */}
      <div className="manga-detail-view__back-button flex items-center gap-3">
        <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
          Back
        </Button>
        {showStickyTitle && state.manga && (
          <span className="manga-detail-view__sticky-title">{getMangaTitle(state.manga)}</span>
        )}
      </div>

      {/* Cached data indicator */}
      {state.usingCachedData && (
        <InfoBar
          text={
            <>
              <strong>Viewing cached data</strong> — Some features require an internet connection
            </>
          }
        />
      )}

      {/* Hero section - Cover + Metadata */}
      <MangaHeroSection manga={state.manga} chapters={state.chapters} progress={state.progress} />

      {/* Description section */}
      <DescriptionSection manga={state.manga} />

      {/* External Links */}
      <ExternalLinksSection manga={state.manga} />

      {/* Alternative Titles */}
      <AlternativeTitlesSection manga={state.manga} />

      {/* Chapter list */}
      <ChapterList
        mangaId={mangaId!}
        manga={state.manga}
        chapters={state.chapters}
        selectedLanguage={state.selectedLanguage}
        sortOrder={state.chapterSort}
        loading={state.chaptersLoading}
        error={state.chaptersError}
        showErrorDetails={showChapterErrorDetails}
        progress={state.progress}
        chapterProgress={state.chapterProgress}
        onLanguageChange={loadChaptersForLanguage}
        onSortChange={(order) => setState((prev) => ({ ...prev, chapterSort: order }))}
        onRetry={() => loadChaptersForLanguage(state.selectedLanguage)}
        onToggleErrorDetails={() => setShowChapterErrorDetails((prev) => !prev)}
      />
    </div>
  )
}

/**
 * Loading skeleton
 */
function MangaDetailSkeleton(): JSX.Element {
  return (
    <div className="manga-detail-view manga-detail-view--loading flex flex-col">
      {/* Back button */}
      <div className="manga-detail-view__back-button">
        <Skeleton width={80} height={32} />
      </div>

      {/* Hero skeleton */}
      <div className="manga-detail-view__hero">
        <div style={{ aspectRatio: '2/3' }}>
          <Skeleton className="manga-detail-view__cover" />
        </div>
        <div className="manga-detail-view__info flex flex-col gap-3">
          <Skeleton width="80%" height={32} />
          <div className="flex gap-2 mt-3 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`hero-tag-skeleton-${i}`} width={80} height={28} />
            ))}
          </div>
          <div className="mt-3">
            <Skeleton width="60%" height={20} />
          </div>
          <div className="mt-2">
            <Skeleton width="50%" height={20} />
          </div>
          <div className="flex gap-2 mt-6">
            <Skeleton width={140} height={36} />
            <Skeleton width={140} height={36} />
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="manga-detail-view__description">
        <Skeleton width={120} height={24} />
        <div className="mt-3">
          <Skeleton width="100%" height={80} />
        </div>
      </div>

      {/* Chapter list skeleton */}
      <div className="manga-detail-view__chapters">
        <Skeleton width={150} height={24} />
        <div className="chapter-list-items mt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={`skel-chapter-${i}`} width="100%" height={56} />
          ))}
        </div>
      </div>
    </div>
  )
}
