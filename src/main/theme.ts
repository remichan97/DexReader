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
    sendAccentColor()
  })
}

export function getCurrentTheme(): 'light' | 'dark' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

export async function getSystemAccentColor(): Promise<string> {
  // Electron's systemPreferences.getAccentColor() returns RGBA format
  // We need to convert it to hex format
  if (process.platform === 'win32') {
    try {
      const { systemPreferences } = await import('electron')
      const accentColor = systemPreferences.getAccentColor()
      // On Windows, accentColor format is 'bbggrraa' (BGR not RGB!)
      // We need to swap red and blue channels and remove alpha
      const bb = accentColor.substring(0, 2)
      const gg = accentColor.substring(2, 4)
      const rr = accentColor.substring(4, 6)
      // Convert BGR to RGB
      return `#${rr}${gg}${bb}`
    } catch {
      // Fallback to default Windows 11 blue
      return '#0078d4'
    }
  } else if (process.platform === 'darwin') {
    try {
      const { systemPreferences } = await import('electron')
      const accentColor = systemPreferences.getAccentColor()
      // On macOS, format is 'rrggbbaa' - already in correct order
      return `#${accentColor.substring(0, 6)}`
    } catch {
      // Fallback to default macOS blue
      return '#007AFF'
    }
  }
  // Fallback for Linux or if system color is unavailable
  return '#0078d4'
}
