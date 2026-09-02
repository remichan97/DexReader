import { useState, useEffect } from 'react'
import { rendererLog } from '@renderer/services/logging.service'

export interface UseUpdateBannerResult {
  showUpdateBanner: boolean
  updateVersion: string
  handleDismissBanner: () => void
  handleViewReleaseNotes: () => Promise<void>
}

/**
 * Detects a just-completed app update (via one-time localStorage flags set
 * before the previous quit) and exposes the banner state + actions to show it.
 */
export function useUpdateBanner(): UseUpdateBannerResult {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [updateVersion, setUpdateVersion] = useState<string>('')

  // Check for update completion flag on startup
  useEffect(() => {
    async function checkForUpdateCompletion(): Promise<void> {
      try {
        const flagValue = localStorage.getItem('dexreader:updateJustCompleted')

        if (flagValue === 'true') {
          // Get version from localStorage (set before quit)
          const storedVersion = localStorage.getItem('dexreader:newVersion')

          // Fallback to app version if storage failed
          let version = storedVersion || ''
          if (!version) {
            const versionResult = await globalThis.appUpdate.getAppVersion()
            version = versionResult.data || 'unknown'
          }

          setUpdateVersion(version)
          setShowUpdateBanner(true)

          // Clear flags immediately (one-time trigger)
          localStorage.removeItem('dexreader:updateJustCompleted')
          localStorage.removeItem('dexreader:newVersion')

          rendererLog.info(`[useUpdateBanner] Update detected, showing banner for v${version}`)
        }
      } catch (error) {
        rendererLog.error('[useUpdateBanner] Failed to check update completion flag:', error)
        // Clean up flags even on error
        localStorage.removeItem('dexreader:updateJustCompleted')
        localStorage.removeItem('dexreader:newVersion')
      }
    }

    void checkForUpdateCompletion()
  }, [])

  const handleDismissBanner = (): void => {
    setShowUpdateBanner(false)
    rendererLog.info('[useUpdateBanner] Update banner dismissed by user')
  }

  const handleViewReleaseNotes = async (): Promise<void> => {
    try {
      const repoUrl = 'https://github.com/remichan97/DexReader'
      const releaseUrl = `${repoUrl}/releases/tag/v${updateVersion}`

      // Open in external browser
      globalThis.open(releaseUrl, '_blank', 'noopener,noreferrer')

      // Auto-dismiss banner after opening release notes
      handleDismissBanner()
    } catch (error) {
      rendererLog.error('[useUpdateBanner] Failed to open release notes:', error)
      // Don't auto-dismiss on error - let user try again or manually dismiss
    }
  }

  return { showUpdateBanner, updateVersion, handleDismissBanner, handleViewReleaseNotes }
}
