import { useState, useEffect } from 'react'

/**
 * Hook to detect which section is currently visible in the viewport
 * Uses Intersection Observer to track section visibility while scrolling
 *
 * @param sectionIds - Array of section IDs to observe
 * @param options - Optional IntersectionObserver configuration
 * @returns The ID of the currently active/visible section
 */
export function useScrollSpy(
  sectionIds: readonly string[],
  options?: IntersectionObserverInit
): string {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || '')

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const sectionsInView = new Set<string>()

    const observerOptions: IntersectionObserverInit = {
      threshold: 0.5,
      rootMargin: '-100px 0px -50% 0px',
      ...options
    }

    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (!element) return

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sectionsInView.add(sectionId)
          } else {
            sectionsInView.delete(sectionId)
          }

          // Update active section to the first visible one in the list
          if (sectionsInView.size > 0) {
            const firstVisible = sectionIds.find((id) => sectionsInView.has(id))
            if (firstVisible) {
              setActiveSection(firstVisible)
            }
          }
        })
      }, observerOptions)

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [sectionIds, options])

  return activeSection
}
