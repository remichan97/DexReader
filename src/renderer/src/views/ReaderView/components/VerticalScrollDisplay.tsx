import React, { useRef, useEffect } from 'react'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { Warning48Regular } from '@fluentui/react-icons'
import type { ImageUrlResponse } from '../../../../../preload/index.d'

/**
 * Vertical Scroll Display Component
 * Displays all pages in a vertical scrollable list
 */
interface VerticalScrollDisplayProps {
  readonly images: ImageUrlResponse[]
  readonly imageStates: Map<number, 'loading' | 'loaded' | 'error'>
  readonly currentPage: number
  readonly onPageChange: (page: number) => void
  readonly onImageLoad: (pageIndex: number) => void
  readonly onImageError: (pageIndex: number) => void
}

export function VerticalScrollDisplay({
  images,
  imageStates,
  currentPage,
  onPageChange,
  onImageLoad,
  onImageError
}: VerticalScrollDisplayProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefsRef = useRef<Map<number, HTMLDivElement>>(new Map())

  // Track visible page with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible page
        let maxRatio = 0
        let mostVisiblePage = currentPage

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            const pageIndex = Number.parseInt(
              entry.target.getAttribute('data-page-index') || '0',
              10
            )
            maxRatio = entry.intersectionRatio
            mostVisiblePage = pageIndex
          }
        })

        // Update current page if a more visible page was found
        if (maxRatio > 0 && mostVisiblePage !== currentPage) {
          onPageChange(mostVisiblePage)
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds for better tracking
        rootMargin: '-20% 0px -20% 0px' // Center area has priority
      }
    )

    // Observe all page elements
    pageRefsRef.current.forEach((element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [currentPage, onPageChange, images.length])

  // Note: Automatic scrollIntoView disabled for vertical mode to allow free scrolling
  // The IntersectionObserver tracks page position without fighting user scroll

  return (
    <div ref={containerRef} className="vertical-scroll-container">
      <div className="vertical-scroll-container__page-wrapper">
        {images.map((image, index) => {
          const pageState = imageStates.get(index)
          const isLoading = pageState === 'loading'
          const hasError = pageState === 'error'

          return (
            <div
              key={index}
              ref={(el) => {
                if (el) {
                  pageRefsRef.current.set(index, el)
                } else {
                  pageRefsRef.current.delete(index)
                }
              }}
              data-page-index={index}
              className="vertical-scroll-container__page"
            >
              {isLoading && (
                <div className="vertical-scroll-page__loading">
                  <ProgressRing size="medium" aria-label={`Loading page ${index + 1}`} />
                </div>
              )}

              {hasError && !isLoading && (
                <div className="vertical-scroll-page__error">
                  <Warning48Regular />
                  <p>Failed to load page {index + 1}</p>
                </div>
              )}

              {!hasError && (
                <img
                  src={image.url}
                  alt={`Page ${index + 1}`}
                  className="vertical-scroll-container__image"
                  onLoad={() => onImageLoad(index)}
                  onError={() => onImageError(index)}
                  loading={index > currentPage + 10 ? 'lazy' : 'eager'}
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
