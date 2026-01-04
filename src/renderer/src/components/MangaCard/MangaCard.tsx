import { useState } from 'react'
import { MangaStatus, BaseComponentProps } from '@renderer/types/components'
import { getLanguageName } from '@renderer/constants/language-list.constant'
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
   * Has new chapters available
   */
  hasNewChapters?: boolean

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
export function MangaCard({
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
  hasNewChapters = false,
  onClick,
  onFavourite,
  className = '',
  'aria-label': ariaLabel
}: Readonly<MangaCardProps>): React.JSX.Element {
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
    ongoing: 'Ongoing',
    completed: 'Completed',
    hiatus: 'Hiatus',
    cancelled: 'Cancelled'
  }

  return (
    <div
      className={classNames}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={ariaLabel || `${title} by ${author || 'Unknown'}`}
    >
      <div className="manga-card__cover-container">
        {!imageLoaded && <div className="manga-card__cover-skeleton" />}

        {imageError ? (
          <div className="manga-card__cover-error">
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
            <span>Cover unavailable</span>
          </div>
        ) : (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            className="manga-card__cover"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Favourite indicator badge (always visible when favourited) */}
        {isFavourite && showFavouriteBadge && (
          <div className="manga-card__favorite-badge" aria-hidden="true">
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

        {/* Update indicator badge (new chapters available) */}
        {hasNewChapters && (
          <div
            className="manga-card__update-badge"
            title="New chapters available"
            aria-label="New chapters available"
          >
            <div className="manga-card__update-badge-dot" />
          </div>
        )}

        {/* Hover overlay with favourite button */}
        {onFavourite && (
          <div className="manga-card__overlay">
            <button
              className="manga-card__favorite-button"
              onClick={handleFavouriteClick}
              aria-label={isFavourite ? 'Unfavourite' : 'Add to favourites'}
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
            aria-label={`${chaptersRead} of ${totalChapters} chapters read`}
          />
        )}
      </div>

      <div className="manga-card__content">
        <h3 className="manga-card__title" title={title}>
          {title}
        </h3>

        {(author || status || languages) && (
          <div className="manga-card__metadata">
            {author && <span className="manga-card__author">{author}</span>}
            {status && (
              <span className={`manga-card__status manga-card__status--${status}`}>
                {statusLabels[status]}
              </span>
            )}
            {languages && languages.length > 0 && (
              <span
                className="manga-card__languages"
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
            {chaptersRead} / {totalChapters} chapters
          </p>
        )}
      </div>
    </div>
  )
}
