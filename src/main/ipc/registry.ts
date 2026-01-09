import { registerFileSystemHandlers } from './handlers/file-systems.handler'
import { registerMangaDexHandlers } from './handlers/mangadex.handler'
import { registerThemeHandlers } from './handlers/theme.handler'
import { registerAppSettingsHandlers } from './handlers/app-settings.handler'
import { registerProgressTrackingHandlers } from './handlers/progress-tracking.handler'
import { registerReaderSettingsHandlers } from './handlers/reader-settings.handler'
import { getMainWindow } from '../window'
import { BrowserWindow } from 'electron'
import { registerAdditionalDialogHandlers } from './handlers/dialogs.handler'
import { registerLibraryHandlers } from './handlers/library-handler'
import { registerMihonHandlers } from './handlers/mihon.handler'

/**
 * Register all IPC handlers
 * Organized by domain for better maintainability
 */
export function registerAllHandlers(): void {
  // Most handlers don't need window reference
  registerMangaDexHandlers()
  registerThemeHandlers()
  registerAppSettingsHandlers()
  registerProgressTrackingHandlers()
  registerReaderSettingsHandlers()
  registerAdditionalDialogHandlers()
  registerLibraryHandlers()
  registerMihonHandlers()

  // File system handlers need window for dialogs
  // Get window reference when handlers are actually called
  const getWindow = (): BrowserWindow => {
    const window = getMainWindow()
    if (!window) {
      throw new Error('Main window not available for file system operations')
    }
    return window
  }

  registerFileSystemHandlers(getWindow)
}
