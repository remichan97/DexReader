import { useEffect, useState } from 'react'

interface UseImagePreloadReturn {
  imageLoadingStates: Map<number, 'loading' | 'loaded' | 'error'>
}

/**
 * Custom hook for preloading images in the reader
 * Preloads current page and next 2 pages for smooth experience
 */
export function useImagePreload(
  currentPage: number,
  images: string[],
  loading: boolean,
  totalPages: number
): UseImagePreloadReturn {
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Map<number, 'loading' | 'loaded' | 'error'>
  >(new Map())

  useEffect(() => {
    if (loading || images.length === 0) return

    // Preload: previous page, current page, next page, and page after that
    const pagesToPreload = [currentPage - 1, currentPage, currentPage + 1, currentPage + 2].filter(
      (page) => page >= 0 && page < totalPages
    )

    pagesToPreload.forEach((pageIndex) => {
      // Skip if already loaded or loading
      if (imageLoadingStates.has(pageIndex)) return

      const img = new Image()
      const imageUrl = images[pageIndex]

      if (!imageUrl) return

      // Set loading state
      setImageLoadingStates((prev) => new Map(prev).set(pageIndex, 'loading'))

      img.onload = (): void => {
        setImageLoadingStates((prev) => new Map(prev).set(pageIndex, 'loaded'))
      }

      img.onerror = (): void => {
        setImageLoadingStates((prev) => new Map(prev).set(pageIndex, 'error'))
      }

      img.src = imageUrl
    })
  }, [currentPage, images, loading, totalPages, imageLoadingStates])

  return { imageLoadingStates }
}
