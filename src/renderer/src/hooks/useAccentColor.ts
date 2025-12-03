import { useEffect, useState } from 'react'

/**
 * Apply accent color to CSS variables
 */
function applyAccentColor(color: string): void {
  const root = document.documentElement
  root.style.setProperty('--win-accent', color)

  // Calculate hover and active states (slightly darker)
  const rgb = Number.parseInt(color.slice(1), 16)
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255

  // Darker for hover (-10%)
  const hoverR = Math.max(0, Math.floor(r * 0.9))
  const hoverG = Math.max(0, Math.floor(g * 0.9))
  const hoverB = Math.max(0, Math.floor(b * 0.9))
  const hoverColor = `#${((hoverR << 16) | (hoverG << 8) | hoverB).toString(16).padStart(6, '0')}`

  // Even darker for active (-20%)
  const activeR = Math.max(0, Math.floor(r * 0.8))
  const activeG = Math.max(0, Math.floor(g * 0.8))
  const activeB = Math.max(0, Math.floor(b * 0.8))
  const activeColor = `#${((activeR << 16) | (activeG << 8) | activeB).toString(16).padStart(6, '0')}`

  root.style.setProperty('--win-accent-hover', hoverColor)
  root.style.setProperty('--win-accent-active', activeColor)
}

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
        const systemAccent = await globalThis.api.getSystemAccentColor()

        // Try to load custom color from settings
        const paths = await globalThis.fileSystem.getAllowedPaths()
        try {
          const settings = await globalThis.fileSystem.readFile(
            paths.appData + '/settings.json',
            'utf-8'
          )
          const parsed = JSON.parse(settings as string)
          if (parsed.accentColor) {
            // User has custom color
            setIsUsingSystemColor(false)
            applyAccentColor(parsed.accentColor)
          } else {
            // Use system color
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
        console.error('Failed to load accent color:', error)
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

    globalThis.api.onAccentColorChanged(handleAccentColorChange)
  }, [isUsingSystemColor])
}
