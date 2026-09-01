import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeftRegular, Warning48Regular, CloudOff48Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Skeleton } from '@renderer/components/Skeleton'
import { InfoBar } from '@renderer/components/InfoBar'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { getMangaTitle } from '@renderer/utils/mangaHelpers'
import MangaHeroSection from './components/MangaHeroSection'
import DescriptionSection from './components/DescriptionSection'
import ExternalLinksSection from './components/ExternalLinksSection'
import AlternativeTitlesSection from './components/AlternativeTitlesSection'
import ChapterList from './components/ChapterList'
import { useMangaDetailData } from './hooks/useMangaDetailData'
import { useMangaProgressTracking } from './hooks/useMangaProgressTracking'
import { useStickyTitle } from './hooks/useStickyTitle'
import './MangaDetailView.css'

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
  const { t } = useTranslation(['mangaDetail', 'common'])
  const isOnline = useConnectivityStore((state) => state.isOnline)

  const [showMainErrorDetails, setShowMainErrorDetails] = useState<boolean>(false)
  const [showChapterErrorDetails, setShowChapterErrorDetails] = useState<boolean>(false)

  const data = useMangaDetailData(mangaId, isOnline, t)
  const { progress, chapterProgress } = useMangaProgressTracking(mangaId, location.pathname)
  const { scrollContainerRef, showStickyTitle } = useStickyTitle(data.manga)

  // Redirect back to browse if this route was reached without a manga ID
  useEffect(() => {
    if (!mangaId) {
      navigate('/browse')
    }
  }, [mangaId, navigate])

  // Update document title with manga name
  useEffect(() => {
    if (data.manga) {
      const mangaTitle = getMangaTitle(data.manga)
      document.title = t('mangaDetail:documentTitle.detail', {
        manga: mangaTitle,
        defaultValue: `${mangaTitle} - DexReader`
      })
    } else if (data.loading) {
      document.title = t('mangaDetail:documentTitle.loading')
    } else {
      document.title =
        t('mangaDetail:pageTitle', { defaultValue: 'Manga Details' }) + ' - DexReader'
    }
  }, [data.manga, data.loading, mangaId, t]) // Include mangaId to force update on navigation

  const handleBackClick = (): void => {
    navigate('/browse')
  }

  // Render loading state
  if (data.loading) {
    return <MangaDetailSkeleton />
  }

  // Render error state
  if (data.error) {
    const isOfflineError = data.error.message.toLowerCase().includes('offline')

    return (
      <div className="manga-detail-view flex flex-col">
        <div className="manga-detail-view__back-button">
          <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
            {t('common:button.back')}
          </Button>
        </div>
        <div className="manga-detail-error flex flex-col items-center justify-center">
          <div className="error-recovery flex flex-col items-center gap-3">
            <div className="error-recovery__icon">
              {isOfflineError ? <CloudOff48Regular /> : <Warning48Regular />}
            </div>
            <h3 className="error-recovery__title">
              {isOfflineError
                ? t('common:message.info.youreOffline')
                : t('mangaDetail:errorState.title')}
            </h3>
            <p className="error-recovery__message">
              {isOfflineError ? data.error.message : t('mangaDetail:errorState.message')}
            </p>
            <div className="error-recovery__actions flex gap-2">
              {isOfflineError ? (
                <Button variant="primary" onClick={() => navigate('/library')}>
                  {t('mangaDetail:offlineError.action')}
                </Button>
              ) : (
                <>
                  <Button variant="primary" onClick={data.handleRetry}>
                    {t('common:button.tryAgain')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowMainErrorDetails(!showMainErrorDetails)}
                  >
                    {showMainErrorDetails
                      ? t('mangaDetail:errorState.hideDetails')
                      : t('mangaDetail:errorState.showDetails')}
                  </Button>
                </>
              )}
            </div>
            {!isOfflineError && showMainErrorDetails && data.error && (
              <div className="error-recovery__technical-details">
                <div>
                  <strong>{t('common:label.error')}</strong> {data.error.message}
                </div>
                {data.error.stack && (
                  <div className="mt-2">
                    <strong>{t('common:label.stackTrace')}</strong>
                    <pre style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: '1.4' }}>
                      {data.error.stack}
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
  if (!data.manga) {
    return (
      <div className="manga-detail-view flex flex-col">
        <div className="manga-detail-view__back-button">
          <Button variant="ghost" onClick={handleBackClick} icon={<ArrowLeftRegular />}>
            {t('common:button.back')}
          </Button>
        </div>
        <div className="manga-detail-error flex flex-col items-center justify-center">
          <h2>{t('mangaDetail:notFound.title', { defaultValue: 'Manga Not Found' })}</h2>
          <p>
            {t('mangaDetail:notFound.message', {
              defaultValue: "This manga doesn't exist or has been removed."
            })}
          </p>
          <Button variant="accent" onClick={() => navigate('/browse')}>
            {t('mangaDetail:notFound.action', { defaultValue: 'Back to Browse' })}
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
          {t('common:button.back')}
        </Button>
        {showStickyTitle && data.manga && (
          <span className="manga-detail-view__sticky-title">
            {t('mangaDetail:stickyTitle', {
              title: getMangaTitle(data.manga),
              defaultValue: getMangaTitle(data.manga)
            })}
          </span>
        )}
      </div>

      {/* Cached data indicator */}
      {data.usingCachedData && (
        <InfoBar
          text={
            <>
              <strong>
                {t('mangaDetail:cachedDataBanner.title', { defaultValue: 'Viewing cached data' })}
              </strong>{' '}
              —{' '}
              {t('mangaDetail:cachedDataBanner.message', {
                defaultValue: 'Some features require an internet connection'
              })}
            </>
          }
        />
      )}

      {/* Hero section - Cover + Metadata */}
      <MangaHeroSection manga={data.manga} chapters={data.chapters} progress={progress} />

      {/* Description section */}
      <DescriptionSection manga={data.manga} />

      {/* External Links */}
      <ExternalLinksSection manga={data.manga} />

      {/* Alternative Titles */}
      <AlternativeTitlesSection manga={data.manga} />

      {/* Chapter list */}
      <ChapterList
        mangaId={mangaId!}
        manga={data.manga}
        chapters={data.chapters}
        selectedLanguage={data.selectedLanguage}
        sortOrder={data.chapterSort}
        loading={data.chaptersLoading}
        error={data.chaptersError}
        showErrorDetails={showChapterErrorDetails}
        progress={progress}
        chapterProgress={chapterProgress}
        onLanguageChange={data.loadChaptersForLanguage}
        onSortChange={data.setChapterSort}
        onRetry={() => data.loadChaptersForLanguage(data.selectedLanguage)}
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
