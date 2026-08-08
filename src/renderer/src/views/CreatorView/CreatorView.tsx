import type { JSX } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Warning48Regular, ArrowLeft24Regular } from '@fluentui/react-icons'
import { EmptyState } from '@renderer/components/EmptyState'
import { MangaCard } from '@renderer/components/MangaCard'
import { SkeletonGrid } from '@renderer/components/Skeleton'
import { Button } from '@renderer/components/Button'
import { useLibraryStore, useToastStore } from '@renderer/stores'
import {
  getCoverImageUrl,
  getAuthorName,
  getMangaTitle,
  mapPublicationStatus,
  getAvailableLanguages
} from '@renderer/utils/mangaHelpers'
import { PublicationStatus } from '@renderer/stores/searchStore'
import { cacheMangaMetadata } from '@renderer/utils/mangaCache'
import { handleUnfavourite } from '@renderer/utils/unfavouriteHandler'
import './CreatorView.css'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'
import type { Manga } from '../../../../preload/window.types'

type MangaEntity = Manga

export function CreatorView(): JSX.Element {
  const { t } = useTranslation(['creator', 'common', 'browse'])
  const navigate = useNavigate()
  const { creatorId, creatorType } = useParams<{
    creatorId: string
    creatorType: 'author' | 'artist'
  }>()

  const [results, setResults] = useState<MangaEntity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [offset, setOffset] = useState<number>(0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [creatorName, setCreatorName] = useState<string>('')

  const limit = 20

  // Library store for favorite management
  const { isFavourite, toggleFavourite, loadFavourites } = useLibraryStore()
  const showToast = useToastStore((state) => state.show)

  // Ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Fetch manga by creator
  const fetchManga = useCallback(
    async (resetOffset = false) => {
      if (!creatorId || !creatorType) return

      const currentOffset = resetOffset ? 0 : offset

      try {
        if (resetOffset) {
          setLoading(true)
          setError(null)
        } else {
          setLoadingMore(true)
        }

        const params = {
          authorOrArtist: creatorId,
          limit,
          offset: currentOffset,
          includes: ['cover_art', 'author', 'artist']
        }

        const response = await globalThis.mangadex.searchManga(params)

        if (response.success === true && response.data?.data) {
          const newResults = resetOffset ? response.data.data : [...results, ...response.data.data]
          setResults(newResults)
          setHasMore(response.data.total ? newResults.length < response.data.total : false)

          // Extract creator name from first result
          if (response.data.data.length > 0 && !creatorName) {
            const firstManga = response.data.data[0]
            const name =
              creatorType === 'author'
                ? getAuthorName(firstManga)
                : (() => {
                    const artistRel = firstManga.relationships?.find((r) => r.type === 'artist')
                    if (artistRel?.attributes && 'name' in artistRel.attributes) {
                      return (artistRel.attributes as { name?: string }).name || 'Unknown'
                    }
                    return 'Unknown'
                  })()
            setCreatorName(name)
          }

          // Cache manga metadata
          await Promise.all(response.data.data.map((manga) => cacheMangaMetadata(manga)))

          if (!resetOffset) {
            setOffset(currentOffset + limit)
          }
        } else {
          setError(t('common:state.error'))
        }
      } catch (err) {
        rendererLog.error('[CreatorView] Error fetching manga:', err)
        setError(t('common:message.error.networkError'))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [creatorId, creatorType, offset, results, limit, creatorName, t]
  )

  // Initial load
  useEffect(() => {
    if (creatorId && creatorType) {
      void fetchManga(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId, creatorType])

  // Update window title
  useEffect(() => {
    if (creatorName) {
      const label = creatorType === 'author' ? t('creator:author') : t('creator:artist')
      document.title = `${t('creator:windowTitle', { name: creatorName, type: label })} - DexReader`
    }
  }, [creatorName, creatorType, t])

  // Infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && !loading && !loadingMore && hasMore) {
        void fetchManga(false)
      }
    },
    [loading, loadingMore, hasMore, fetchManga]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection])

  // Handle favorite toggle
  const handleFavouriteToggle = async (mangaId: string): Promise<void> => {
    const currentlyFavourited = isFavourite(mangaId)

    if (currentlyFavourited) {
      // Get manga title for unfavourite confirmation
      const manga = results.find((m) => m.id === mangaId)
      const mangaTitle = manga ? getMangaTitle(manga) : 'this manga'

      await handleUnfavourite({
        mangaId,
        mangaTitle,
        onSuccess: () => {
          loadFavourites()
        }
      })
    } else {
      // Just toggle favourite
      try {
        await toggleFavourite(mangaId)
        showToast({
          title: t('common:message.success.addedToLibrary'),
          message: '',
          variant: 'info',
          duration: 2000
        })
      } catch (err) {
        rendererLog.error('[CreatorView] Error toggling favourite:', err)
        showToast({
          title: t('common:state.error'),
          message: t('common:message.error.unknownError'),
          variant: 'error',
          duration: 3000
        })
      }
    }
  }

  // Handle manga card click
  const handleMangaClick = (mangaId: string): void => {
    navigate(`/browse/${mangaId}`)
  }

  const handleBackClick = (): void => {
    navigate(-1)
  }

  // Render loading state
  if (loading && !results.length) {
    return (
      <div className="creator-view">
        <div className="creator-view__header">
          <Button variant="ghost" className="creator-view__back-button" onClick={handleBackClick}>
            <ArrowLeft24Regular />
          </Button>
          <div className="creator-view__title-group">
            <div className="creator-view__skeleton-title" />
            <div className="creator-view__skeleton-subtitle" />
          </div>
        </div>
        <SkeletonGrid count={20} />
      </div>
    )
  }

  // Render error state
  if (error && !results.length) {
    return (
      <div className="creator-view">
        <div className="creator-view__header">
          <Button variant="ghost" className="creator-view__back-button" onClick={handleBackClick}>
            <ArrowLeft24Regular />
          </Button>
          <div className="creator-view__title-group">
            <h1 className="creator-view__title">{t('common:state.error')}</h1>
          </div>
        </div>
        <EmptyState
          icon={<Warning48Regular />}
          title={t('common:state.error')}
          message={error}
          action={{
            label: t('common:button.retry'),
            onClick: () => void fetchManga(true),
            variant: 'primary'
          }}
        />
      </div>
    )
  }

  // Render empty state
  if (!loading && results.length === 0) {
    return (
      <div className="creator-view">
        <div className="creator-view__header">
          <Button variant="ghost" className="creator-view__back-button" onClick={handleBackClick}>
            <ArrowLeft24Regular />
          </Button>
          <div className="creator-view__title-group">
            <h1 className="creator-view__title">{creatorName || t('creator:unknownCreator')}</h1>
            <p className="creator-view__subtitle">
              {creatorType === 'author' ? t('creator:author') : t('creator:artist')}
            </p>
          </div>
        </div>
        <EmptyState
          icon={<Warning48Regular />}
          title={t('creator:noWorks')}
          message={t('creator:noWorksMessage')}
          action={{
            label: t('common:button.goBack'),
            onClick: handleBackClick,
            variant: 'primary'
          }}
        />
      </div>
    )
  }

  // Render results
  return (
    <div className="creator-view">
      <div className="creator-view__header">
        <Button variant="ghost" className="creator-view__back-button" onClick={handleBackClick}>
          <ArrowLeft24Regular />
        </Button>
        <div className="creator-view__title-group">
          <h1 className="creator-view__title">{creatorName || t('creator:unknownCreator')}</h1>
          <p className="creator-view__subtitle">
            {creatorType === 'author' ? t('creator:author') : t('creator:artist')}
          </p>
        </div>
      </div>

      <div className="creator-view__grid">
        {results.map((manga) => (
          <MangaCard
            key={manga.id}
            id={manga.id}
            coverUrl={getCoverImageUrl(manga)}
            title={getMangaTitle(manga)}
            author={getAuthorName(manga)}
            status={mapPublicationStatus(
              (manga.attributes as { status: PublicationStatus }).status
            )}
            languages={getAvailableLanguages(manga)}
            isFavourite={isFavourite(manga.id)}
            onClick={handleMangaClick}
            onFavourite={handleFavouriteToggle}
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} className="creator-view__sentinel" />}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="creator-view__loading-more">
          <SkeletonGrid count={limit} />
        </div>
      )}
    </div>
  )
}
