import { getCurrentTheme, getSystemAccentColor } from '../../theme'
import { wrapIpcHandler } from '../wrapHandler'

export function registerThemeHandlers(): void {
  // Theme IPC handlers
  wrapIpcHandler('theme:get-system-accent-color', async () => {
    return getSystemAccentColor()
  })

  // IPC handler for theme request
  wrapIpcHandler('get-theme', () => {
    return getCurrentTheme()
  })
}
