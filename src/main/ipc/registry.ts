import { registerFileSystemHandlers } from './handlers/file-systems.handler'
import { registerMangaDexHandlers } from './handlers/mangadex.handler'
import { registerThemeHandlers } from './handlers/theme.handler'
import { registerAppSettingsHandlers } from './handlers/app-settings.handler'
import { registerProgressTrackingHandlers } from './handlers/progress-tracking.handler'
import { registerReaderSettingsHandlers } from './handlers/reader-settings.handler'
import { getMainWindow } from '../window'
import { BrowserWindow } from 'electron'
import { registerAdditionalDialogHandlers } from './handlers/dialogs.handler'
import { registerLibraryHandlers } from './handlers/library.handler'
import { registerCollectionsHandlers } from './handlers/collections.handler'
import { registerHistoryHandlers } from './handlers/history.handler'
import { registerMihonHandlers } from './handlers/mihon.handler'
import { registerDexReaderHandler } from './handlers/dexreader.handler'
import { registerDownloadHandlers } from './handlers/download.handler'
import { registerDownloadQueueHandlers } from './handlers/download-queue.handler'
import { registerStorageHandlers } from './handlers/storage.handler'
import type { ImageProxy } from '../api/proxy/image.proxy'
import { registerAppUpdateHandler } from './handlers/app-update.handler'
import { registerLoggerHandlers } from './handlers/logger.handler'
import { registerSearchPresetsHandler } from './handlers/search-presets.handler'
import { registerGatekeeperHandlers } from './handlers/gatekeeper.handler'
import { registerShellHandlers } from './handlers/shell.handler'

/**
 * Register all IPC handlers
 * Organized by domain for better maintainability
 */
export function registerAllHandlers(imageProxy?: ImageProxy): void {
  // Most handlers don't need window reference
  registerMangaDexHandlers()
  registerThemeHandlers()
  registerAppSettingsHandlers(imageProxy)
  registerProgressTrackingHandlers()
  registerReaderSettingsHandlers()
  registerAdditionalDialogHandlers()
  registerLibraryHandlers()
  registerCollectionsHandlers()
  registerHistoryHandlers()
  registerMihonHandlers()
  registerDexReaderHandler()
  registerDownloadHandlers()
  registerDownloadQueueHandlers()
  registerStorageHandlers()
  registerLoggerHandlers()
  registerAppUpdateHandler()
  registerSearchPresetsHandler()
  registerGatekeeperHandlers()
  registerShellHandlers()

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
