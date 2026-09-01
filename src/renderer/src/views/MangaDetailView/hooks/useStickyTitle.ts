import { useEffect, useRef, useState, type RefObject } from 'react'

export interface UseStickyTitleResult {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  showStickyTitle: boolean
}

/**
 * Shows a sticky title once the page has scrolled past the hero section.
 * Re-attaches the scroll listener whenever `dependency` changes, since the
 * scroll container's DOM node can be replaced (e.g. loading skeleton → content).
 */
export function useStickyTitle(dependency: unknown): UseStickyTitleResult {
  const [showStickyTitle, setShowStickyTitle] = useState<boolean>(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = (): void => {
      if (scrollContainerRef.current) {
        // Show title when scrolled more than 300px (past hero section)
        setShowStickyTitle(scrollContainerRef.current.scrollTop > 300)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
    return undefined
  }, [dependency])

  return { scrollContainerRef, showStickyTitle }
}
