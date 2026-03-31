import { nativeTheme, BrowserWindow } from 'electron'

export function setupThemeDetection(mainWindow: BrowserWindow): void {
  // Send initial theme to renderer
  const sendTheme = (): void => {
    const isDark = nativeTheme.shouldUseDarkColors
    mainWindow.webContents.send('theme-changed', isDark ? 'dark' : 'light')
  }

  // Send accent color to renderer
  const sendAccentColor = async (): Promise<void> => {
    const accentColor = await getSystemAccentColor()
    mainWindow.webContents.send('accent-color-changed', accentColor)
  }

  // Send theme on initial load
  mainWindow.webContents.on('did-finish-load', () => {
    sendTheme()
    sendAccentColor()
  })

  // Listen for system theme changes
  nativeTheme.on('updated', () => {
    sendTheme()
    // Invalidate cache and fetch new accent color on theme change
    cachedAccentColor = null
    sendAccentColor()
  })
}

export function getCurrentTheme(): 'light' | 'dark' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

// Cache accent color to avoid redundant system calls
let cachedAccentColor: string | null = null

export async function getSystemAccentColor(): Promise<string> {
  // Return cached value if available
  if (cachedAccentColor) {
    return cachedAccentColor
  }

  // Electron's systemPreferences.getAccentColor() returns RGBA format
  if (process.platform === 'win32') {
    try {
      const { systemPreferences } = await import('electron')
      const accentColor = systemPreferences.getAccentColor()

      // KNOWN ISSUE (Electron 41): The returned color doesn't match Windows Settings UI
      // Windows Settings shows: #3C74C5
      // systemPreferences.getAccentColor() returns: 125DABFF
      // This appears to be returning a variant color (light/dark accent) rather than the main one
      // Electron 38 used BGR format (BBGGRRAA), Electron 41 appears to use RGBA format (RRGGBBAA)

      // Extract RGB bytes (ignore alpha)
      const rr = accentColor.substring(0, 2)
      const gg = accentColor.substring(2, 4)
      const bb = accentColor.substring(4, 6)
      // Alpha is at position 6-8 (ignored)

      // Electron 41 format appears to be RGBA (standard format)
      cachedAccentColor = `#${rr}${gg}${bb}`
      return cachedAccentColor
    } catch {
      // Fallback to default Windows 11 blue
      cachedAccentColor = '#0078d4'
      return cachedAccentColor
    }
  } else if (process.platform === 'darwin') {
    try {
      const { systemPreferences } = await import('electron')
      const accentColor = systemPreferences.getAccentColor()
      // On macOS, format is 'rrggbbaa' - already in correct order
      cachedAccentColor = `#${accentColor.substring(0, 6)}`
      return cachedAccentColor
    } catch {
      // Fallback to default macOS blue
      cachedAccentColor = '#007AFF'
      return cachedAccentColor
    }
  }
  // Fallback for Linux or if system color is unavailable
  cachedAccentColor = '#0078d4'
  return cachedAccentColor
}
