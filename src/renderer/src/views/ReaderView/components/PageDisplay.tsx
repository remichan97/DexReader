import React, { type JSX } from 'react'
import { ProgressRing } from '@renderer/components/ProgressRing'

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
    <div className="reader-page-container">
      {isLoading && (
        <div className="reader-page-loading">
          <ProgressRing size="large" aria-label="Loading page" />
          <p className="reader-page-loading__text">
            Loading page {pageNumber + 1} of {totalPages}...
          </p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="reader-page-error">
          <p>Failed to load page {pageNumber + 1}</p>
          <p className="reader-page-error__hint">Try navigating to another page</p>
        </div>
      )}

      {!hasError && (
        <div
          className="reader-page"
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
          aria-label={`Page ${pageNumber + 1} of ${totalPages}. Click or use keyboard to navigate.`}
          style={{ display: isLoading ? 'none' : 'flex' }}
        >
          {/* Navigation indicators - clickable even when zoomed */}
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--left"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateLeft()
            }}
            aria-label="Previous page"
          >
            <span>◀</span>
          </button>
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--right"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateRight()
            }}
            aria-label="Next page"
          >
            <span>▶</span>
          </button>

          <img
            src={imageUrl}
            alt={`Page ${pageNumber + 1}`}
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
