import { useState } from 'react'
import { MangaStatus, BaseComponentProps } from '@renderer/types/components'
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
   * Is manga favorited
   */
  isFavorite?: boolean

  /**
   * Click handler
   */
  onClick?: (id: string) => void

  /**
   * Favorite toggle handler
   */
  onFavorite?: (id: string) => void
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
 *   onFavorite={handleFavorite}
 * />
 * ```
 */
export function MangaCard({
  id,
  coverUrl,
  title,
  author,
  status,
  chaptersRead,
  totalChapters,
  variant = 'grid',
  isFavorite = false,
  onClick,
  onFavorite,
  className = '',
  'aria-label': ariaLabel
}: MangaCardProps): React.JSX.Element {
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

  const handleFavoriteClick = (event: React.MouseEvent): void => {
    event.stopPropagation()
    onFavorite?.(id)
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
    hiatus: 'Hiatus'
  }

  return (
    <article
      className={classNames}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={ariaLabel || `${title} by ${author || 'Unknown'}`}
    >
      <div className="manga-card__cover-container">
        {!imageLoaded && <div className="manga-card__cover-skeleton" />}

        {!imageError ? (
          <img
            src={coverUrl}
            alt={`${title} cover`}
            className="manga-card__cover"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="manga-card__cover-fallback">
            <svg
              className="manga-card__cover-fallback-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 15L16 10L5 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Hover overlay with favorite button */}
        {onFavorite && (
          <div className="manga-card__overlay">
            <button
              className="manga-card__favorite-button"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              type="button"
            >
              <svg
                className="manga-card__favorite-icon"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
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
          <div className="manga-card__progress-bar">
            <div
              className="manga-card__progress-fill"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${chaptersRead} of ${totalChapters} chapters read`}
            />
          </div>
        )}
      </div>

      <div className="manga-card__content">
        <h3 className="manga-card__title" title={title}>
          {title}
        </h3>

        {(author || status) && (
          <div className="manga-card__metadata">
            {author && <span className="manga-card__author">{author}</span>}
            {status && (
              <span className={`manga-card__status manga-card__status--${status}`}>
                {statusLabels[status]}
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
    </article>
  )
}
