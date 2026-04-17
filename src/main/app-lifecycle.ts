import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { databaseConnection } from './database/connection'
import { downloadQueueService } from './services/download-queue.service'
import type { ImageProxy } from './api/proxy/image.proxy'

import { mainLog } from './services/logging/main-logging.service'

export function setupAppLifecycle(imageProxy?: ImageProxy): void {
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    mainLog.debug('[AppLifecycle] Activate event received')
    if (BrowserWindow.getAllWindows().length === 0) {
      mainLog.info('[AppLifecycle] No windows open, creating new window')
      createWindow()
    }
  })

  app.on('window-all-closed', () => {
    mainLog.info('[AppLifecycle] All windows closed')
    if (process.platform !== 'darwin') {
      mainLog.info('[AppLifecycle] Non-macOS platform, initiating quit sequence')
      databaseConnection.close()
      app.quit()
    } else {
      mainLog.debug('[AppLifecycle] macOS platform, keeping app alive')
    }
  })

  // Graceful shutdown: close database connection before quitting
  // Synchronous operation completes immediately before app exits
  app.on('before-quit', () => {
    mainLog.info('[AppLifecycle] App quitting, starting cleanup...')
    databaseConnection.close()
    mainLog.debug('[AppLifecycle] Download queue cleanup initiated')
    downloadQueueService.cleanup()
    mainLog.debug('[AppLifecycle] Image proxy cleanup initiated')
    imageProxy?.destroy() // Clean up image cache timers
    mainLog.info('[AppLifecycle] Cleanup complete, app will quit')
  })
}
