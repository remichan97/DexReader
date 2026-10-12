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
        const systemAccentResult = await globalThis.api.getSystemAccentColor()
        if (!systemAccentResult.success || !systemAccentResult.data) {
          throw new Error('Failed to get system accent color')
        }
        const systemAccent = systemAccentResult.data

        const settingsResult = await globalThis.settings.load()
        const customAccent = settingsResult.success
          ? settingsResult.data?.appearance.accentColor
          : undefined

        if (customAccent) {
          setIsUsingSystemColor(false)
          applyAccentColor(customAccent)
        } else {
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
