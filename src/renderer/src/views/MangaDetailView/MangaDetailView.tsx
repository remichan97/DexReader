import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftRegular, Warning48Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Skeleton } from '@renderer/components/Skeleton'
import { useProgressStore } from '@renderer/stores/progressStore'
import { getMangaTitle } from '@renderer/utils/mangaHelpers'
import MangaHeroSection from './components/MangaHeroSection'
import DescriptionSection from './components/DescriptionSection'
import ExternalLinksSection from './components/ExternalLinksSection'
import TagsSection from './components/TagsSection'
import ChapterList from './components/ChapterList'
import './MangaDetailView.css'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

// Module-level cache to persist data across component remounts
const mangaCache = new Map<
  string,
  {
    manga: MangaEntity
    chapters: ChapterEntity[]
    selectedLanguage: string
    chapterSort: 'asc' | 'desc'
  }
>()

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
}

/**
 * MangaDetailView - Comprehensive manga detail page
 *
 * Displays full manga information including cover, description, tags,
 * and complete chapter list with filtering and sorting.
 */
export function MangaDetailView(): JSX.Element {
  const { mangaId } = useParams<{ mangaId: string }>()
  const navigate = useNavigate()

  // Initialize state from cache if available
  const cachedData = mangaId ? mangaCache.get(mangaId) : null
  const [state, setState] = useState<MangaDetailViewState>({
    manga: cachedData?.manga || null,
    chapters: cachedData?.chapters || [],
    loading: !cachedData, // Don't show loading if we have cached data
    error: null,
    selectedLanguage: cachedData?.selectedLanguage || 'en',
    chapterSort: cachedData?.chapterSort || 'asc',
    chaptersLoading: false,
    chaptersError: null,
    progress: null
  })
  const [showMainErrorDetails, setShowMainErrorDetails] = useState<boolean>(false)
  const [showChapterErrorDetails, setShowChapterErrorDetails] = useState<boolean>(false)
  const [showStickyTitle, setShowStickyTitle] = useState<boolean>(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Progress tracking
  const loadProgress = useProgressStore((state) => state.loadProgress)
  const progressMap = useProgressStore((state) => state.progressMap)

  // Load manga details and chapters on mount
  useEffect(() => {
    if (!mangaId) {
      navigate('/browse')
      return
    }

    // Only load if we don't have data for this manga yet (cache behavior)
    if (state.manga?.id !== mangaId) {
      loadMangaDetails(mangaId)
    }

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

  /**
   * Fetch manga details and chapter list from API
   */
  const loadMangaDetails = async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      // Fetch manga with relationships (IPC wrapped response)
      const mangaResponse = await globalThis.mangadex.getManga(id, [
        'cover_art',
        'author',
        'artist'
      ])

      // Check IPC success
      if (!mangaResponse.success || !mangaResponse.data) {
        throw new Error(mangaResponse.error?.message || 'Failed to fetch manga')
      }

      // Check API result
      if (mangaResponse.data.result === 'error') {
        throw new Error('Failed to fetch manga from API')
      }

      const manga = mangaResponse.data.data

      // Get available languages from manga
      const availableLanguages =
        (manga.attributes as { availableTranslatedLanguages?: string[] })
          .availableTranslatedLanguages || []

      // Determine initial language (prefer English if available, otherwise first available)
      const initialLanguage = availableLanguages.includes('en')
        ? 'en'
        : availableLanguages[0] || 'en'

      // Set manga data first (allow view to render even if chapters fail)
      setState((prev) => ({
        ...prev,
        manga: manga,
        selectedLanguage: initialLanguage,
        loading: false,
        chaptersLoading: true,
        chaptersError: null
      }))

      // Fetch initial chapter list for selected language
      try {
        const chaptersResponse = await globalThis.mangadex.getMangaFeed(id, {
          limit: 100,
          offset: 0,
          translatedLanguage: [initialLanguage],
          order: { chapter: 'asc' },
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

        setState((prev) => {
          const newState = {
            ...prev,
            chapters: chaptersResponse.data.data,
            chaptersLoading: false,
            chaptersError: null
          }

          // Update cache
          if (manga) {
            mangaCache.set(id, {
              manga: manga,
              chapters: chaptersResponse.data.data,
              selectedLanguage: initialLanguage,
              chapterSort: 'asc'
            })
          }

          return newState
        })
      } catch (chapterError) {
        console.error('Failed to load chapters:', chapterError)
        setState((prev) => ({
          ...prev,
          chapters: [],
          chaptersLoading: false,
          chaptersError:
            chapterError instanceof Error ? chapterError : new Error(String(chapterError))
        }))
      }
    } catch (error) {
      console.error('Failed to load manga details:', error)
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        loading: false
      }))
    }
  }

  /**
   * Load chapters for a specific language
   */
  const loadChaptersForLanguage = async (language: string): Promise<void> => {
    if (!mangaId) return

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

      setState((prev) => {
        const newState = {
          ...prev,
          chapters: chaptersResponse.data.data,
          selectedLanguage: language,
          chaptersLoading: false,
          chaptersError: null
        }

        // Update cache
        if (prev.manga && mangaId) {
          mangaCache.set(mangaId, {
            manga: prev.manga,
            chapters: chaptersResponse.data.data,
            selectedLanguage: language,
            chapterSort: prev.chapterSort
          })
        }

        return newState
      })
    } catch (error) {
      console.error('Failed to load chapters for language:', error)
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
    return (
      <div className="manga-detail-view">
        <div className="manga-detail-view__back-button">
          <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
            Back
          </Button>
        </div>
        <div className="manga-detail-error">
          <div className="error-recovery">
            <div className="error-recovery__icon">
              <Warning48Regular />
            </div>
            <h3 className="error-recovery__title">Couldn&apos;t load this manga</h3>
            <p className="error-recovery__message">
              Something went wrong while trying to fetch this manga. It might be unavailable,
              deleted, or there could be a connection issue.
            </p>
            <div className="error-recovery__actions">
              <Button variant="primary" onClick={handleRetry}>
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowMainErrorDetails(!showMainErrorDetails)}
              >
                {showMainErrorDetails ? 'Hide' : 'Show'} technical details
              </Button>
            </div>
            {showMainErrorDetails && state.error && (
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
      </div>
    )
  }

  // Render manga not found
  if (!state.manga) {
    return (
      <div className="manga-detail-view">
        <div className="manga-detail-view__back-button">
          <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
            Back
          </Button>
        </div>
        <div className="manga-detail-error">
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
    <div className="manga-detail-view" ref={scrollContainerRef}>
      {/* Back button with optional sticky title */}
      <div className="manga-detail-view__back-button">
        <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
          Back
        </Button>
        {showStickyTitle && state.manga && (
          <span className="manga-detail-view__sticky-title">{getMangaTitle(state.manga)}</span>
        )}
      </div>

      {/* Hero section - Cover + Metadata */}
      <MangaHeroSection manga={state.manga} chapters={state.chapters} progress={state.progress} />

      {/* Description section */}
      <DescriptionSection manga={state.manga} />

      {/* External Links */}
      <ExternalLinksSection manga={state.manga} />

      {/* Tags section */}
      <TagsSection manga={state.manga} />

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
    <div className="manga-detail-view manga-detail-view--loading">
      {/* Back button */}
      <div className="manga-detail-view__back-button">
        <Skeleton width={80} height={32} />
      </div>

      {/* Hero skeleton */}
      <div className="manga-detail-view__hero">
        <div style={{ aspectRatio: '2/3' }}>
          <Skeleton className="manga-detail-view__cover" />
        </div>
        <div className="manga-detail-view__info">
          <Skeleton width="80%" height={32} />
          <div style={{ marginTop: '12px' }}>
            <Skeleton width="60%" height={20} />
          </div>
          <div style={{ marginTop: '8px' }}>
            <Skeleton width="50%" height={20} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <Skeleton width={140} height={36} />
            <Skeleton width={140} height={36} />
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="manga-detail-view__description">
        <Skeleton width={120} height={24} />
        <div style={{ marginTop: '12px' }}>
          <Skeleton width="100%" height={80} />
        </div>
      </div>

      {/* Tags skeleton */}
      <div className="manga-detail-view__tags">
        <Skeleton width={80} height={24} />
        <div className="tags-container" style={{ marginTop: '12px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`tag-skeleton-${i}`} width={80} height={28} />
          ))}
        </div>
      </div>

      {/* Chapter list skeleton */}
      <div className="manga-detail-view__chapters">
        <Skeleton width={150} height={24} />
        <div className="chapter-list-items" style={{ marginTop: '16px' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={`chapter-skeleton-${i}`} width="100%" height={56} />
          ))}
        </div>
      </div>
    </div>
  )
}
