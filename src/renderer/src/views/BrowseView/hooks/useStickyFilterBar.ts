import { useEffect, useRef, useState, type RefObject } from 'react'

export interface UseStickyFilterBarResult {
  searchBarRef: RefObject<HTMLDivElement | null>
  showFilterBar: boolean
}

/**
 * Tracks whether the search bar has scrolled out of view, so a sticky info bar
 * summarising the active filters can surface further down the page without
 * duplicating the filter count badge the search bar already shows near the top.
 */
export function useStickyFilterBar(enabled: boolean): UseStickyFilterBarResult {
  const [showFilterBar, setShowFilterBar] = useState(false)
  const searchBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchBar = searchBarRef.current
    if (!searchBar || !enabled) {
      setShowFilterBar(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show info bar once the search bar (and its own filter badge) scrolls out of view
        setShowFilterBar(!entry.isIntersecting)
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '0px'
      }
    )

    observer.observe(searchBar)

    return () => {
      observer.disconnect()
    }
  }, [enabled])

  return { searchBarRef, showFilterBar }
}
