import { BrowserWindow } from 'electron'
import { registerFileSystemHandlers } from './handlers/file-systems.handler'
import { registerMangaDexHandlers } from './handlers/mangadex.handler'
import { registerThemeHandlers } from './handlers/theme.handler'
import { registerAppSettingsHandlers } from './handlers/app-settings.handler'
import { registerProgressTrackingHandlers } from './handlers/progress-tracking.handler'
import { registerReaderSettingsHandlers } from './handlers/reader-settings.handler'

export function registerAllHandlers(mainWindow: BrowserWindow): void {
  registerFileSystemHandlers(mainWindow)
  registerMangaDexHandlers()
  registerThemeHandlers()
  registerAppSettingsHandlers()
  registerProgressTrackingHandlers()
  registerReaderSettingsHandlers()
}
