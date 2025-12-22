import React from 'react'
import { ProgressRing } from '@renderer/components/ProgressRing'
import type { ImageUrlResponse } from '../../../../../preload/index.d'

/**
 * Double Page Display Component
 * Displays two pages side-by-side for spread reading mode
 */
interface DoublePageDisplayProps {
  readonly images: ImageUrlResponse[]
  readonly pagePair: [number] | [number, number]
  readonly imageStates: Map<number, 'loading' | 'loaded' | 'error'>
  readonly fitMode: 'width' | 'height' | 'actual' | 'custom'
  readonly onImageLoad: (pageIndex: number) => void
  readonly onImageError: (pageIndex: number) => void
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
  readonly readRightToLeft: boolean
}

export function DoublePageDisplay({
  images,
  pagePair,
  imageStates,
  fitMode,
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
}: DoublePageDisplayProps): React.JSX.Element {
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

  const isSinglePage = pagePair.length === 1
  const isLoading = pagePair.some((idx) => imageStates.get(idx) === 'loading')
  const hasError = pagePair.some((idx) => imageStates.get(idx) === 'error')

  // Page order is already determined by generatePagePairs based on reading direction
  // No need to reverse here as pairs are already in correct order
  const pageOrder = pagePair

  return (
    <div className="reader-page-container">
      {isLoading && (
        <div className="reader-page-loading">
          <ProgressRing size="large" aria-label="Loading pages" />
          <p className="reader-page-loading__text">Loading pages...</p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="reader-page-error">
          <p>Failed to load one or more pages</p>
          <p className="reader-page-error__hint">Try navigating to another page</p>
        </div>
      )}

      {!hasError && (
        <div
          className={`double-page-container ${isSinglePage ? 'double-page-container--single' : ''}`}
          onClick={onClick}
          onWheel={onWheel}
          style={{ display: isLoading ? 'none' : 'flex' }}
        >
          {/* Navigation indicators */}
          <button
            type="button"
            className="reader-page__nav-indicator reader-page__nav-indicator--left"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateLeft()
            }}
            aria-label="Previous pages"
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
            aria-label="Next pages"
          >
            <span>▶</span>
          </button>

          {pageOrder.map((pageIndex) => (
            <div key={pageIndex} className="double-page-container__page">
              <img
                src={images[pageIndex].url}
                alt={`Page ${pageIndex + 1}`}
                className={`reader-page__image reader-page__image--fit-${fitMode === 'custom' ? 'height' : fitMode}`}
                style={imageStyle}
                onLoad={() => onImageLoad(pageIndex)}
                onError={() => onImageError(pageIndex)}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
