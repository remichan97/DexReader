import type { JSX } from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRegular,
  BookOpenRegular,
  StarRegular,
  GlobeRegular,
  Warning48Regular,
  PlayCircle24Regular
} from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Select } from '@renderer/components/Select'
import { Skeleton } from '@renderer/components/Skeleton'
import { useProgressStore } from '@renderer/stores/progressStore'
import {
  getCoverImageUrl,
  getMangaTitle,
  getAuthorName,
  getArtistName,
  mapPublicationStatus,
  getMangaYear,
  getContentRatingText,
  type MangaStatus
} from '@renderer/utils/mangaHelpers'
import { getLanguageName } from '@renderer/constants/language-list.constant'
import { CoverSize } from '@renderer/utils/mangaHelpers'
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
      <MangaHeroSection manga={state.manga} chapters={state.chapters} />

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
        onLanguageChange={loadChaptersForLanguage}
        onSortChange={(order) => setState((prev) => ({ ...prev, chapterSort: order }))}
        onRetry={() => loadChaptersForLanguage(state.selectedLanguage)}
        onToggleErrorDetails={() => setShowChapterErrorDetails((prev) => !prev)}
      />
    </div>
  )
}

/**
 * Hero section with cover image and metadata
 */
interface MangaHeroSectionProps {
  readonly manga: MangaEntity
  readonly chapters: ChapterEntity[]
}

function MangaHeroSection({ manga, chapters }: MangaHeroSectionProps): JSX.Element {
  const navigate = useNavigate()
  const coverUrl = getCoverImageUrl(manga, CoverSize.Large)
  const title = getMangaTitle(manga)
  const author = getAuthorName(manga)
  const artist = getArtistName(manga)
  const status = mapPublicationStatus(manga.attributes.status)
  const year = getMangaYear(manga)
  const contentRating = getContentRatingText(manga.attributes.contentRating)
  const demographic = manga.attributes.publicationDemographic
  const lastVolume = manga.attributes.lastVolume
  const lastChapter = manga.attributes.lastChapter

  const handleReadClick = (): void => {
    if (chapters.length === 0) return

    // If progress exists, continue from last read position
    if (state.progress) {
      const lastChapter = chapters.find((ch) => ch.id === state.progress!.lastChapterId)
      if (lastChapter) {
        navigate(`/reader/${manga.id}/${lastChapter.id}`, {
          state: {
            chapterNumber: lastChapter.attributes.chapter,
            chapterTitle: lastChapter.attributes.title,
            mangaTitle: getMangaTitle(manga),
            chapters: chapters,
            startPage: state.progress.lastPage // Start at last read page
          }
        })
        return
      }
    }

    // Navigate to first chapter (no progress or chapter not found)
    const firstChapter = chapters[0]
    navigate(`/reader/${manga.id}/${firstChapter.id}`, {
      state: {
        chapterNumber: firstChapter.attributes.chapter,
        chapterTitle: firstChapter.attributes.title,
        mangaTitle: getMangaTitle(manga),
        chapters: chapters // Pass full chapter list for navigation
      }
    })
  }

  const handleAddToLibrary = (): void => {
    // TODO: Implement in Phase 3 (Library Management)
    console.log('Add to library:', manga.id)
  }

  return (
    <div className="manga-detail-view__hero">
      {/* Cover Image */}
      <div className="manga-detail-view__cover">
        <img src={coverUrl} alt={`${title} cover`} loading="eager" />
      </div>

      {/* Metadata */}
      <div className="manga-detail-view__info">
        <h1 className="manga-detail-view__title">{title}</h1>

        <div className="manga-detail-view__metadata">
          <p className="manga-detail-view__author">
            <strong>Author:</strong> {author}
          </p>
          <p className="manga-detail-view__artist">
            <strong>Artist:</strong> {artist}
          </p>
          <p className="manga-detail-view__status">
            <strong>Status:</strong> <StatusBadge status={status} />
          </p>
          {demographic && (
            <p className="manga-detail-view__demographic">
              <strong>Demographic:</strong> <DemographicBadge demographic={demographic} />
            </p>
          )}
          {year && (
            <p className="manga-detail-view__year">
              <strong>Year:</strong> {year}
            </p>
          )}
          <p className="manga-detail-view__rating">
            <strong>Rating:</strong> {contentRating}
          </p>
          {(lastVolume || lastChapter) && (
            <p className="manga-detail-view__length">
              <strong>Length:</strong>{' '}
              {lastVolume && `${lastVolume} volume${lastVolume === '1' ? '' : 's'}`}
              {lastVolume && lastChapter && ' • '}
              {lastChapter && `${lastChapter} chapter${lastChapter === '1' ? '' : 's'}`}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="manga-detail-view__actions">
          {state.progress ? (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<PlayCircle24Regular />}
            >
              Continue Reading
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleReadClick}
              disabled={chapters.length === 0}
              icon={<BookOpenRegular />}
            >
              Start Reading
            </Button>
          )}
          <Button variant="secondary" onClick={handleAddToLibrary} icon={<StarRegular />}>
            Add to Library
          </Button>
        </div>

        {/* Progress badge on cover */}
        {state.progress && (
          <div className="manga-detail-view__progress-badge">
            <PlayCircle24Regular />
            <span>
              Ch. {state.progress.lastChapterNumber || '?'}, p. {state.progress.lastPage + 1}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Status badge component
 */
interface StatusBadgeProps {
  readonly status: MangaStatus
}

function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/**
 * Demographic badge component
 */
interface DemographicBadgeProps {
  readonly demographic: string
}

function DemographicBadge({ demographic }: DemographicBadgeProps): JSX.Element {
  const displayText = demographic.charAt(0).toUpperCase() + demographic.slice(1)
  return (
    <span className={`demographic-badge demographic-badge--${demographic}`}>{displayText}</span>
  )
}

/**
 * Description section with expand/collapse
 */
interface DescriptionSectionProps {
  readonly manga: MangaEntity
}

function DescriptionSection({ manga }: DescriptionSectionProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  // Get description (prefer English)
  const description =
    manga.attributes.description?.en ||
    manga.attributes.description?.['ja-ro'] ||
    Object.values(manga.attributes.description || {})[0] ||
    'No description available.'

  const maxLength = 300
  const shouldTruncate = description.length > maxLength
  const displayText =
    expanded || !shouldTruncate ? description : description.slice(0, maxLength) + '...'

  return (
    <div className="manga-detail-view__description">
      <h2 className="section-title">Description</h2>
      <p className="description-text">{displayText}</p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          className="description-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  )
}

/**
 * External links section
 */
interface ExternalLinksSectionProps {
  readonly manga: MangaEntity
}

function ExternalLinksSection({ manga }: ExternalLinksSectionProps): JSX.Element {
  const links = manga.attributes.links || {}

  // Service name mapping
  const serviceNames: Record<string, string> = {
    al: 'AniList',
    ap: 'Anime-Planet',
    bw: 'BookWalker',
    mu: 'MangaUpdates',
    mal: 'MyAnimeList',
    kt: 'Kitsu',
    amz: 'Amazon',
    cdj: 'CDJapan',
    ebj: 'eBookJapan',
    raw: 'Official Raw'
  }

  // Build URLs from link keys
  const getExternalUrl = (key: string, value: string): string => {
    const urlMap: Record<string, (val: string) => string> = {
      al: (id) => `https://anilist.co/manga/${id}`,
      ap: (slug) => `https://www.anime-planet.com/manga/${slug}`,
      bw: (slug) => `https://bookwalker.jp/${slug}`,
      mu: (id) => `https://www.mangaupdates.com/series/${id}`,
      mal: (id) => `https://myanimelist.net/manga/${id}`,
      kt: (id) => `https://kitsu.io/manga/${id}`,
      raw: (url) => url // Raw is already a full URL
    }
    return urlMap[key] ? urlMap[key](value) : value
  }

  // Handle external link click with confirmation
  const handleExternalLinkClick = async (key: string, value: string): Promise<void> => {
    const url = getExternalUrl(key, value)
    const serviceName = serviceNames[key]

    const confirmed = await globalThis.api.showConfirmDialog(
      `Open ${serviceName}?`,
      `You're about to open an external website in your default browser. Just so you know where you're headed:\n\n${url}`
    )

    if (confirmed) {
      globalThis.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const linkEntries = Object.entries(links).filter(([key]) => serviceNames[key])

  if (linkEntries.length === 0) return <></>

  return (
    <section className="external-links-section">
      <h3>External Links</h3>
      <div className="external-links-list">
        {linkEntries.map(([key, value]) => (
          <Button
            key={key}
            variant="secondary"
            size="small"
            icon={<GlobeRegular />}
            onClick={() => handleExternalLinkClick(key, value)}
            title={`View on ${serviceNames[key]}`}
          >
            {serviceNames[key]}
          </Button>
        ))}
      </div>
    </section>
  )
}

/**
 * Tags section
 */
interface TagsSectionProps {
  readonly manga: MangaEntity
}

function TagsSection({ manga }: TagsSectionProps): JSX.Element {
  const navigate = useNavigate()

  // Extract tags from attributes (tags are always included in manga response)
  const tags =
    (
      manga.attributes as {
        tags?: Array<{ id: string; attributes: { name: { en?: string }; group: string } }>
      }
    )?.tags?.map((tag) => ({
      id: tag.id,
      name: tag.attributes.name.en || 'Unknown',
      group: tag.attributes.group
    })) || []

  const handleTagClick = (tagId: string): void => {
    navigate(`/browse?tag=${tagId}`)
  }

  if (tags.length === 0) return <></>

  return (
    <div className="manga-detail-view__tags">
      <h2 className="section-title">Tags</h2>
      <div className="tags-container">
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant="ghost"
            className="tag tag--theme"
            onClick={() => handleTagClick(tag.id)}
          >
            {tag.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Chapter list with filtering and sorting
 */
interface ChapterListProps {
  readonly mangaId: string
  readonly manga: MangaEntity
  readonly chapters: ChapterEntity[]
  readonly selectedLanguage: string
  readonly sortOrder: 'asc' | 'desc'
  readonly loading: boolean
  readonly error: Error | null
  readonly showErrorDetails: boolean
  readonly onLanguageChange: (lang: string) => void
  readonly onSortChange: (order: 'asc' | 'desc') => void
  readonly onRetry: () => void
  readonly onToggleErrorDetails: () => void
}

function ChapterList({
  mangaId,
  manga,
  chapters,
  selectedLanguage,
  sortOrder,
  loading,
  error,
  showErrorDetails,
  onLanguageChange,
  onSortChange,
  onRetry,
  onToggleErrorDetails
}: ChapterListProps): JSX.Element {
  const navigate = useNavigate()

  // Get available languages from manga attributes
  const availableLanguages = useMemo(() => {
    const langs =
      (manga.attributes as { availableTranslatedLanguages?: string[] })
        .availableTranslatedLanguages || []
    return langs.sort((a, b) => a.localeCompare(b))
  }, [manga])

  // Filter and sort chapters
  const displayChapters = useMemo(() => {
    // Chapters are already filtered by language from API
    const filtered = [...chapters]

    // Sort by chapter number
    filtered.sort((a, b) => {
      const aNum = Number.parseFloat(a.attributes.chapter || '0')
      const bNum = Number.parseFloat(b.attributes.chapter || '0')
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
    })

    return filtered
  }, [chapters, sortOrder])

  return (
    <div className="manga-detail-view__chapters">
      {/* Header with controls */}
      <div className="chapter-list-header">
        <h2 className="section-title">Chapters ({displayChapters.length})</h2>

        <div className="chapter-controls">
          {/* Language filter */}
          {availableLanguages.length > 1 && (
            <Select
              value={selectedLanguage}
              onChange={(val) => onLanguageChange(val as string)}
              options={availableLanguages.map((lang) => ({
                value: lang,
                label: `${getLanguageName(lang)} (${lang.toUpperCase()})`
              }))}
              aria-label="Select chapter language"
            />
          )}

          {/* Sort order */}
          <Select
            value={sortOrder}
            onChange={(val) => onSortChange(val as 'asc' | 'desc')}
            options={[
              { value: 'asc', label: 'Oldest First' },
              { value: 'desc', label: 'Newest First' }
            ]}
            aria-label="Sort chapters"
          />
        </div>
      </div>

      {/* Chapter items */}
      <div className="chapter-list-items">
        {loading && (
          <div className="chapter-list-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`chapter-loading-${i}`} width="100%" height={56} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="chapter-list-error">
            <p className="error-message">Couldn&apos;t load chapters for this language</p>
            <p className="error-hint">Try refreshing or picking a different language.</p>
            <div className="error-actions">
              <Button variant="secondary" onClick={onRetry}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={onToggleErrorDetails}>
                {showErrorDetails ? 'Hide' : 'Show'} technical details
              </Button>
            </div>
            {showErrorDetails && error && (
              <div className="error-technical-details">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: '1.4' }}>
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !error && displayChapters.length === 0 && (
          <div className="chapter-list-empty">
            <p>
              No chapters available in {getLanguageName(selectedLanguage)} (
              {selectedLanguage.toUpperCase()})
            </p>
            <p className="chapter-list-empty-hint">
              Chapters may have been removed by translators or are currently unavailable.
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                window.open(
                  `https://mangadex.org/title/${mangaId}`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              View on MangaDex
            </Button>
          </div>
        )}

        {!loading &&
          !error &&
          displayChapters.length > 0 &&
          displayChapters.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              onClick={() =>
                navigate(`/reader/${mangaId}/${chapter.id}`, {
                  state: {
                    chapterNumber: chapter.attributes.chapter,
                    chapterTitle: chapter.attributes.title,
                    mangaTitle: manga ? getMangaTitle(manga) : 'Manga',
                    chapters: chapters // Pass full chapter list for navigation
                  }
                })
              }
            />
          ))}
      </div>
    </div>
  )
}

/**
 * Individual chapter item
 */
interface ChapterItemProps {
  readonly chapter: ChapterEntity
  readonly onClick: () => void
}

function ChapterItem({ chapter, onClick }: ChapterItemProps): JSX.Element {
  const chapterNum = chapter.attributes.chapter || '0'
  const title = chapter.attributes.title || 'Untitled'
  const publishDate = new Date(chapter.attributes.publishAt).toLocaleDateString()

  // Get scanlation group name
  const scanlationGroup = chapter.relationships.find((r) => r.type === 'scanlation_group')
  const groupName = scanlationGroup?.attributes?.name || 'Unknown Group'

  return (
    <Button
      variant="ghost"
      className="chapter-item"
      onClick={onClick}
      aria-label={`Read Chapter ${chapterNum}: ${title}`}
    >
      <div className="chapter-item__content">
        <div className="chapter-item__main">
          <span className="chapter-item__number">Ch. {chapterNum}</span>
          <div className="chapter-item__info">
            {title && <span className="chapter-item__title">{title}</span>}
            <span className="chapter-item__group">{groupName}</span>
          </div>
        </div>

        <div className="chapter-item__meta">
          <span className="chapter-item__date">{publishDate}</span>
        </div>
      </div>
    </Button>
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
