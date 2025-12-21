import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'

export function setupAppLifecycle(): void {
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // Before stopping the app, save all reading progress
  app.on('before-quit', async (event) => {
    event.preventDefault()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait a second for everything to settle
    app.exit(0)
  })
}
