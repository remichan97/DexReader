import React, { type JSX } from 'react'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { useTranslation } from '@renderer/hooks/useTranslation'

/**
 * Page Display Component
 */
interface PageDisplayProps {
  readonly imageUrl: string
  readonly pageNumber: number
  readonly totalPages: number
  readonly fitMode: 'width' | 'height' | 'actual' | 'custom'
  readonly isLoading: boolean
  readonly hasError: boolean
  readonly onImageLoad: () => void
  readonly onImageError: () => void
  readonly onClick: (e: React.MouseEvent<HTMLDivElement>) => void
  // Zoom/Pan props
  readonly zoomLevel: number
  readonly panX: number
  readonly panY: number
  readonly isDragging: boolean
  readonly onMouseDown: (e: React.MouseEvent<Element>) => void
  readonly onMouseMove: (e: React.MouseEvent<Element>) => void
  readonly onMouseUp: (e: React.MouseEvent<Element>) => void
  readonly onWheel: (e: React.WheelEvent<Element>) => void
  readonly transformOriginX: number
  readonly transformOriginY: number
  // Navigation handlers
  readonly onNavigateLeft: () => void
  readonly onNavigateRight: () => void
}

export function PageDisplay({
  imageUrl,
  pageNumber,
  totalPages,
  fitMode,
  isLoading,
  hasError,
  onImageLoad,
  onImageError,
  onClick,
  zoomLevel,
  panX,
  panY,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  transformOriginX,
  transformOriginY,
  onNavigateLeft,
  onNavigateRight
}: PageDisplayProps): JSX.Element {
  const { t } = useTranslation('reader')

  // Calculate image transform style
  const getCursor = (): string => {
    if (fitMode === 'custom' || zoomLevel > 1) {
      return isDragging ? 'grabbing' : 'grab'
    }
    return 'default'
  }

  const imageStyle: React.CSSProperties = {
    transform:
      fitMode === 'custom'
        ? `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`
        : undefined,
    transformOrigin: `${transformOriginX}% ${transformOriginY}%`,
    cursor: getCursor(),
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
  }

  return (
    <div className="reader-page-container flex items-center justify-center">
      {isLoading && (
        <div className="reader-page-loading flex flex-col items-center justify-center">
          <ProgressRing size="large" aria-label={t('page.loading.ariaLabel')} />
          <p className="reader-page-loading__text">
            {t('page.loading.text', { current: pageNumber + 1, total: totalPages })}
          </p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="reader-page-error flex flex-col items-center justify-center">
          <p>{t('page.error.failed', { page: pageNumber + 1 })}</p>
          <p className="reader-page-error__hint">{t('page.error.hint')}</p>
        </div>
      )}

      {!hasError && (
        <div
          className="reader-page flex items-center justify-center"
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick(e as unknown as React.MouseEvent<HTMLDivElement>)
            }
          }}
          onWheel={onWheel}
          role="button"
          tabIndex={0}
          aria-label={t('page.navigation.ariaLabel', {
            current: pageNumber + 1,
            total: totalPages
          })}
          style={{ display: isLoading ? 'none' : 'flex' }}
        >
          {/* Navigation indicators - clickable even when zoomed */}
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--left flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateLeft()
            }}
            aria-label={t('page.navigation.previous')}
          >
            <span>◀</span>
          </button>
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--right flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateRight()
            }}
            aria-label={t('page.navigation.next')}
          >
            <span>▶</span>
          </button>

          <img
            src={imageUrl}
            alt={t('page.image.alt', { current: pageNumber + 1, total: totalPages })}
            className={`reader-page__image reader-page__image--fit-${fitMode === 'custom' ? 'height' : fitMode}`}
            style={imageStyle}
            onLoad={onImageLoad}
            onError={onImageError}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
      )}
    </div>
  )
}
