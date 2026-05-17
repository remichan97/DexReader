import { useState, memo } from 'react'
import { MangaStatus, BaseComponentProps } from '@renderer/types/components'
import { getLanguageName } from '@renderer/constants/language-list.constant'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './MangaCard.css'

export interface MangaCardProps extends BaseComponentProps {
  /**
   * Unique manga identifier
   */
  id: string

  /**
   * Cover image URL
   */
  coverUrl: string

  /**
   * Manga title
   */
  title: string

  /**
   * Manga author (optional)
   */
  author?: string

  /**
   * Publication status (optional)
   */
  status?: MangaStatus

  /**
   * Available languages (optional)
   */
  languages?: string[]

  /**
   * Number of chapters read (optional)
   */
  chaptersRead?: number

  /**
   * Total number of chapters (optional)
   */
  totalChapters?: number

  /**
   * Display variant
   * @default 'grid'
   */
  variant?: 'grid' | 'list'

  /**
   * Is manga favourited
   */
  isFavourite?: boolean

  /**
   * Show favourite badge indicator
   * @default true
   */
  showFavouriteBadge?: boolean

  /**
   * Show download badge indicator (for non-favorited downloaded titles)
   * @default false
   */
  showDownloadBadge?: boolean

  /**
   * Has downloads available (shows subtle overlay indicator)
   * @default false
   */
  hasDownloads?: boolean

  /**
   * Click handler
   */
  onClick?: (id: string) => void

  /**
   * Favourite toggle handler
   */
  onFavourite?: (id: string) => void
}

/**
 * MangaCard component for displaying manga covers in grid or list layout
 *
 * Memoized to prevent unnecessary re-renders when parent updates (e.g., infinite scroll adds new items).
 * Only re-renders when props change.
 *
 * @example
 * ```tsx
 * <MangaCard
 *   id="manga-123"
 *   coverUrl="/covers/manga-123.jpg"
 *   title="One Piece"
 *   author="Oda Eiichiro"
 *   status="ongoing"
 *   chaptersRead={1050}
 *   totalChapters={1100}
 *   onClick={handleMangaClick}
 *   onFavourite={handleFavourite}
 * />
 * ```
 */
export const MangaCard = memo(function MangaCard({
  id,
  coverUrl,
  title,
  author,
  status,
  languages,
  chaptersRead,
  totalChapters,
  variant = 'grid',
  isFavourite = false,
  showFavouriteBadge = true,
  showDownloadBadge = false,
  hasDownloads = false,
  onClick,
  onFavourite,
  className = '',
  'aria-label': ariaLabel
}: Readonly<MangaCardProps>): React.JSX.Element {
  const { t } = useTranslation(['common'])
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const hasProgress = chaptersRead !== undefined && totalChapters !== undefined && totalChapters > 0
  const progressPercentage = hasProgress ? (chaptersRead / totalChapters) * 100 : 0

  const classNames = [
    'manga-card',
    `manga-card--${variant}`,
    !imageLoaded && 'manga-card--loading',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (): void => {
    onClick?.(id)
  }

  const handleFavouriteClick = (event: React.MouseEvent): void => {
    event.stopPropagation()
    onFavourite?.(id)
  }

  const handleImageLoad = (): void => {
    setImageLoaded(true)
  }

  const handleImageError = (): void => {
    setImageError(true)
    setImageLoaded(true)
  }

  const statusLabels: Record<MangaStatus, string> = {
    ongoing: t('common:manga.status.ongoing'),
    completed: t('common:manga.status.completed'),
    hiatus: t('common:manga.status.hiatus'),
    cancelled: t('common:manga.status.cancelled')
  }

  // Generate comprehensive aria-label
  const defaultAriaLabel = (): string => {
    let label = title
    if (author) label += ` ${t('common:manga.by')} ${author}`
    if (status) label += ` - ${statusLabels[status]}`
    if (hasProgress)
      label += ` - ${t('common:manga.chaptersRead', { read: chaptersRead, total: totalChapters })}`
    return label
  }

  return (
    <div
      className={classNames + ' flex flex-col'}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={ariaLabel || defaultAriaLabel()}
    >
      <div className="manga-card__cover-container">
        {!imageLoaded && <div className="manga-card__cover-skeleton" />}

        {imageError ? (
          <div className="manga-card__cover-error flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>{t('common:manga.coverUnavailable')}</span>
          </div>
        ) : (
          <img
            src={coverUrl}
            alt={t('common:manga.coverAlt', { title })}
            className="manga-card__cover"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Favourite indicator badge (always visible when favourited) */}
        {isFavourite && showFavouriteBadge && (
          <div
            className="manga-card__favorite-badge flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="manga-card__favorite-badge-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}

        {/* Download indicator badge (for non-favorited downloads) - Top Right */}
        {showDownloadBadge && !isFavourite && (
          <div
            className="manga-card__download-badge flex items-center justify-center"
            aria-hidden="true"
            title={t('common:manga.downloadedNotInLibrary')}
          >
            <svg
              className="manga-card__download-badge-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.5 14.9429L7.5 10.9429L8.91421 9.52869L10.5 11.1145V3.5H12.5V11.1145L14.0858 9.52869L15.5 10.9429L11.5 14.9429ZM5.5 20.5C4.96957 20.5 4.51086 20.3232 4.12384 19.9696C3.73682 19.616 3.54331 19.1891 3.5 18.6889V15.5H5.5V18.5H17.5V15.5H19.5V18.6889C19.5 19.2193 19.3232 19.678 18.9696 20.0651C18.616 20.4521 18.1891 20.6456 17.6889 20.6456L5.5 20.5Z" />
            </svg>
          </div>
        )}

        {/* Download overlay indicator (for ALL downloaded titles) - Bottom Left */}
        {hasDownloads && (
          <div
            className="manga-card__download-overlay flex items-center justify-center"
            aria-hidden="true"
            title={t('common:manga.availableOffline')}
          >
            <svg
              className="manga-card__download-overlay-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.5 14.9429L7.5 10.9429L8.91421 9.52869L10.5 11.1145V3.5H12.5V11.1145L14.0858 9.52869L15.5 10.9429L11.5 14.9429ZM5.5 20.5C4.96957 20.5 4.51086 20.3232 4.12384 19.9696C3.73682 19.616 3.54331 19.1891 3.5 18.6889V15.5H5.5V18.5H17.5V15.5H19.5V18.6889C19.5 19.2193 19.3232 19.678 18.9696 20.0651C18.616 20.4521 18.1891 20.6456 17.6889 20.6456L5.5 20.5Z" />
            </svg>
          </div>
        )}

        {/* Hover overlay with favourite button */}
        {onFavourite && (
          <div className="manga-card__overlay flex items-center justify-center">
            <button
              className="manga-card__favorite-button flex items-center justify-center"
              onClick={handleFavouriteClick}
              aria-label={
                isFavourite ? t('common:manga.unfavourite') : t('common:manga.addToFavourites')
              }
              type="button"
            >
              <svg
                className="manga-card__favorite-icon"
                viewBox="0 0 24 24"
                fill={isFavourite ? 'currentColor' : 'none'}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Progress bar */}
        {hasProgress && (
          <progress
            className="manga-card__progress-bar"
            value={progressPercentage}
            max={100}
            aria-label={t('common:manga.progressAriaLabel', {
              read: chaptersRead,
              total: totalChapters
            })}
          />
        )}
      </div>

      <div className="manga-card__content flex flex-col gap-2">
        <h3 className="manga-card__title" title={title}>
          {title}
        </h3>

        {(author || status || languages) && (
          <div className="manga-card__metadata flex items-center gap-2 flex-wrap">
            {author && <span className="manga-card__author">{author}</span>}
            {status && (
              <span
                className={`manga-card__status manga-card__status--${status} inline-flex items-center`}
              >
                {statusLabels[status]}
              </span>
            )}
            {languages && languages.length > 0 && (
              <span
                className="manga-card__languages inline-flex items-center"
                title={languages.map((code) => getLanguageName(code)).join(', ')}
              >
                {languages
                  .slice(0, 3)
                  .map((code) => code.toUpperCase())
                  .join(', ')}
                {languages.length > 3 ? ` +${languages.length - 3}` : ''}
              </span>
            )}
          </div>
        )}

        {hasProgress && (
          <p className="manga-card__progress-text">
            {t('common:manga.chapters', { read: chaptersRead, total: totalChapters })}
          </p>
        )}
      </div>
    </div>
  )
})
