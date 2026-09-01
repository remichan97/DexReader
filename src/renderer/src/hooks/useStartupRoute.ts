import { useEffect, useState } from 'react'
import { rendererLog } from '@renderer/services/logging.service'

/**
 * Map startup page setting to route path
 */
function mapStartupPageToRoute(startupPage: string): string {
  switch (startupPage) {
    case 'library':
      return '/library'
    case 'downloads':
      return '/downloads'
    case 'browse':
    default:
      return '/browse'
  }
}

/**
 * Loads the user's preferred startup page from settings and resolves it to a
 * route path. Returns `null` while the preference is still loading.
 */
export function useStartupRoute(): string | null {
  const [startupRoute, setStartupRoute] = useState<string | null>(null)

  useEffect(() => {
    async function loadStartupPreference(): Promise<void> {
      try {
        const settings = await globalThis.settings.load()
        if (settings.success) {
          setStartupRoute(mapStartupPageToRoute(settings.data.appearance.startupPage))
          return
        }
        // If loading fails, fall back to default
        setStartupRoute('/browse')
      } catch (error) {
        rendererLog.error('[useStartupRoute] Failed to load startup page setting:', error)
        // Fall back to default
        setStartupRoute('/browse')
      }
    }
    void loadStartupPreference()
  }, [])

  return startupRoute
}
