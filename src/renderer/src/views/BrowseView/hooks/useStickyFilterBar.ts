import { useEffect, useRef, useState, type RefObject } from 'react'

export interface UseStickyFilterBarResult {
  filterPanelRef: RefObject<HTMLDivElement | null>
  showFilterBar: boolean
}

/**
 * Shows a sticky info bar summarising the active filters once the filter
 * panel itself has scrolled out of view (and only while filters are shown).
 */
export function useStickyFilterBar(showFilters: boolean): UseStickyFilterBarResult {
  const [showFilterBar, setShowFilterBar] = useState(false)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const filterPanel = filterPanelRef.current
    if (!filterPanel || !showFilters) {
      setShowFilterBar(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show info bar when filter panel is not visible
        setShowFilterBar(!entry.isIntersecting)
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '0px'
      }
    )

    observer.observe(filterPanel)

    return () => {
      observer.disconnect()
    }
  }, [showFilters])

  return { filterPanelRef, showFilterBar }
}
