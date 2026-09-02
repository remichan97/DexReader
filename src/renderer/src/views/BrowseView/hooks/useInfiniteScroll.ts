import { useCallback, useEffect, useRef, type RefObject } from 'react'

/**
 * Loads more results when the sentinel element scrolls into view, 200px
 * before it's actually reached so the next page is ready ahead of time.
 */
export function useInfiniteScroll(
  loading: boolean,
  hasMore: boolean,
  loadMore: () => void
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && !loading && hasMore) {
        loadMore()
      }
    },
    [loading, hasMore, loadMore]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '200px', // Trigger 200px before reaching the sentinel
      threshold: 0
    })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection])

  return sentinelRef
}
