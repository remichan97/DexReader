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
    const sectionsInView = new Set<string>()

    const observerOptions: IntersectionObserverInit = {
      threshold: 0,
      rootMargin: '-100px 0px -50% 0px',
      ...options
    }

    // Single observer for all sections
    const observer = new IntersectionObserver((entries) => {
      // Update the sectionsInView Set based on all entries
      entries.forEach((entry) => {
        const sectionId = entry.target.id
        if (entry.isIntersecting) {
          sectionsInView.add(sectionId)
        } else {
          sectionsInView.delete(sectionId)
        }
      })

      // After processing all entries, update active section
      if (sectionsInView.size > 0) {
        // Find the first visible section in the original order
        const firstVisible = sectionIds.find((id) => sectionsInView.has(id))
        if (firstVisible) {
          setActiveSection(firstVisible)
        }
      }
    }, observerOptions)

    // Observe all sections with the single observer
    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [sectionIds, options])

  return activeSection
}
