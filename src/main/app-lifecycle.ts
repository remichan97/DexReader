import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { databaseConnection } from './database/connection'

export function setupAppLifecycle(): void {
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      databaseConnection.close()
      app.quit()
    }
  })

  // Graceful shutdown: close database connection before quitting
  // Synchronous operation completes immediately before app exits
  app.on('before-quit', () => {
    databaseConnection.close()
  })
}
