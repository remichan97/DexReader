import { nativeTheme, BrowserWindow } from 'electron'

export function setupThemeDetection(mainWindow: BrowserWindow): void {
  // Send initial theme to renderer
  const sendTheme = () => {
    const isDark = nativeTheme.shouldUseDarkColors
    mainWindow.webContents.send('theme-changed', isDark ? 'dark' : 'light')
  }

  // Send theme on initial load
  mainWindow.webContents.on('did-finish-load', () => {
    sendTheme()
  })

  // Listen for system theme changes
  nativeTheme.on('updated', () => {
    sendTheme()
  })
}

export function getCurrentTheme(): 'light' | 'dark' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}
