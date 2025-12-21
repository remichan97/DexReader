import { BrowserWindow, dialog } from 'electron'
import { getAppDataPath, getDownloadsPath } from '../../filesystem/pathValidator'
import { secureFs } from '../../filesystem/secureFs'
import { setDownloadsPath } from '../../filesystem/settingsManager'
import { getSystemAccentColor } from '../../theme'
import { validateEncoding, validatePath } from '../validators'
import { wrapIpcHandler } from '../wrapHandler'

export function registerFileSystemHandlers(mainWindow: BrowserWindow): void {
  // Read files
  wrapIpcHandler('fs:read-file', async (_event, filePath: unknown, encoding: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    const validEncoding = validateEncoding(encoding, 'encoding')
    return await secureFs.readFile(validPath, validEncoding)
  })

  // Write files
  wrapIpcHandler('fs:write-file', async (_event, filePath: unknown, data: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.writeFile(validPath, data as string | Buffer)
    return true
  })

  // Copy files
  wrapIpcHandler('fs:copy-file', async (_event, srcPath: unknown, destPath: unknown) => {
    const validSrcPath = validatePath(srcPath, 'srcPath')
    const validDestPath = validatePath(destPath, 'destPath')
    await secureFs.copyFile(validSrcPath, validDestPath)
    return true
  })

  // Append to file
  wrapIpcHandler('fs:append-file', async (_event, filePath: unknown, data: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.appendFile(validPath, data as string | Buffer)
    return true
  })

  // Rename file or directory
  wrapIpcHandler('fs:rename', async (_event, oldPath: unknown, newPath: unknown) => {
    const validOldPath = validatePath(oldPath, 'oldPath')
    const validNewPath = validatePath(newPath, 'newPath')
    await secureFs.rename(validOldPath, validNewPath)
    return true
  })

  // Check if path exists
  wrapIpcHandler('fs:is-exists', async (_event, pathToCheck: unknown) => {
    const validPath = validatePath(pathToCheck, 'path')
    return await secureFs.isExists(validPath)
  })

  // Create directory
  wrapIpcHandler('fs:mkdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    await secureFs.mkdir(validPath)
    return true
  })

  // Delete file
  wrapIpcHandler('fs:unlink', async (_event, filePath: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.deleteFile(validPath)
    return true
  })

  // Delete directory
  wrapIpcHandler('fs:rm', async (_event, dirPath: unknown, options: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    await secureFs.deleteDir(validPath, options as { recursive?: boolean } | undefined)
    return true
  })

  // Get stats
  wrapIpcHandler('fs:stat', async (_event, pathToStat: unknown) => {
    const validPath = validatePath(pathToStat, 'path')
    const stats = await secureFs.stat(validPath)
    // Serialise Stats object for IPC
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString()
    }
  })

  // Read directory
  wrapIpcHandler('fs:readdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    return await secureFs.readDir(validPath)
  })

  // Get Allowed Paths
  wrapIpcHandler('fs:get-allowed-paths', async () => {
    return {
      appData: getAppDataPath(),
      downloads: getDownloadsPath()
    }
  })

  // Theme IPC handlers
  wrapIpcHandler('theme:get-system-accent-color', async () => {
    return getSystemAccentColor()
  })

  // Select download folder using native dialog
  wrapIpcHandler('fs:select-downloads-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose where to save downloaded manga',
      defaultPath: getDownloadsPath(),
      buttonLabel: 'Select Folder'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { cancelled: true, filePath: undefined }
    }

    const selectedPath = result.filePaths[0]

    try {
      await setDownloadsPath(selectedPath)
      return { cancelled: false, filePath: selectedPath }
    } catch (error) {
      throw new Error(`Unable to set downloads folder: ${error}`)
    }
  })
}
