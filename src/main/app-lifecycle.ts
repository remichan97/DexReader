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

  // Before stopping the app, save all reading progress
  app.on('before-quit', async (event) => {
    event.preventDefault()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait a second for everything to settle
    databaseConnection.close()
    app.exit(0)
  })
}
