import { rendererLog } from '@renderer/services/logging.service'
import { applyAccentColor } from '@renderer/utils/accentColor'
import { useEffect, useState } from 'react'

/**
 * Hook to load and apply accent color on app startup
 * Also listens for system accent color changes
 */
export function useAccentColor(): void {
  const [isUsingSystemColor, setIsUsingSystemColor] = useState(true)

  // Load and apply accent color on mount
  useEffect(() => {
    async function loadAccentColor(): Promise<void> {
      try {
        // Get system accent color first
        const systemAccentResult = await globalThis.api.getSystemAccentColor()
        if (!systemAccentResult.success) {
          throw new Error('Failed to get system accent color')
        }
        const systemAccent = systemAccentResult.data as string

        // Try to load custom color from settings
        const pathsResult = await globalThis.fileSystem.getAllowedPaths()
        if (!pathsResult.success || !pathsResult.data) {
          throw new Error('Failed to get allowed paths')
        }
        const paths = pathsResult.data

        try {
          const settingsResult = await globalThis.fileSystem.readFile(
            paths.appData + '/settings.json',
            'utf-8'
          )
          if (settingsResult.success && settingsResult.data) {
            const parsed = JSON.parse(settingsResult.data as string)
            if (parsed.accentColor) {
              // User has custom color
              setIsUsingSystemColor(false)
              applyAccentColor(parsed.accentColor)
            } else {
              // Use system color
              setIsUsingSystemColor(true)
              applyAccentColor(systemAccent)
            }
          } else {
            // No settings file or can't read it - use system color
            setIsUsingSystemColor(true)
            applyAccentColor(systemAccent)
          }
        } catch {
          // No settings file or can't read it - use system color
          setIsUsingSystemColor(true)
          applyAccentColor(systemAccent)
        }
      } catch (error) {
        // Fallback to default if everything fails
        rendererLog.error('[useAccentColor] Failed to load accent color:', error)
        applyAccentColor('#0078d4')
      }
    }

    loadAccentColor()
  }, [])

  // Listen for system accent color changes
  useEffect(() => {
    const handleAccentColorChange = (newColor: string): void => {
      // Only update if user is using system color
      if (isUsingSystemColor) {
        applyAccentColor(newColor)
      }
    }

    return globalThis.api.onAccentColorChanged(handleAccentColorChange)
  }, [isUsingSystemColor])
}
