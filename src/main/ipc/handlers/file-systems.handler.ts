import { BrowserWindow, dialog, shell } from 'electron'
import { getAppDataPath, getDownloadsPath } from '../../filesystem/path-validator'
import { secureFs } from '../../filesystem/secure-fs'
import { validateEncoding, validatePath } from '../validators'
import { wrapIpcHandler } from '../wrap-handler'
import { settingsManager } from '../../settings/settings-manager'
import { toError } from '@shared/utils/to-error.util'

export function registerFileSystemHandlers(getWindow: () => BrowserWindow): void {
  /**
   * Read file contents with security restrictions.
   *
   * Reads files only from allowed directories (AppData and user-configured downloads folder).
   * Paths outside these directories are rejected for security.
   *
   * @param filePath - Absolute file path (must be in allowed directories)
   * @param encoding - File encoding: 'utf-8', 'ascii', 'base64', 'binary', or null for Buffer
   * @returns Promise<string | Buffer> - File contents as string (if encoded) or Buffer
   * @throws {Error} - If path is outside allowed directories or file doesn't exist
   *
   * @example
   * // Read text file
   * const content = await window.api.readFile('C:\\...\\AppData\\...\\data.json', 'utf-8')
   *
   * @example
   * // Read binary file
   * const buffer = await window.api.readFile('C:\\...\\Downloads\\image.png', null)
   */
  wrapIpcHandler('fs:read-file', async (_event, filePath: unknown, encoding: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    const validEncoding = validateEncoding(encoding, 'encoding')
    return await secureFs.readFile(validPath, validEncoding)
  })

  /**
   * Write data to file with security restrictions.
   *
   * Writes files only to allowed directories (AppData and downloads folder).
   * Creates parent directories if they don't exist.
   *
   * @param filePath - Absolute file path (must be in allowed directories)
   * @param data - File content as string or Buffer
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If path is outside allowed directories or write fails
   *
   * @example
   * // Write JSON file
   * await window.api.writeFile('C:\\...\\AppData\\...\\settings.json', JSON.stringify(data))
   */
  wrapIpcHandler('fs:write-file', async (_event, filePath: unknown, data: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.writeFile(validPath, data as string | Buffer)
    return true
  })

  /**
   * Copy file from source to destination with security restrictions.
   *
   * Both source and destination must be in allowed directories.
   * Overwrites destination if it exists.
   *
   * @param srcPath - Absolute source file path
   * @param destPath - Absolute destination file path
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If paths are invalid or copy fails
   *
   * @example
   * // Copy backup file
   * await window.api.copyFile(
   *   'C:\\...\\AppData\\...\\backup.db',
   *   'C:\\...\\Downloads\\backup-2026.db'
   * )
   */
  wrapIpcHandler('fs:copy-file', async (_event, srcPath: unknown, destPath: unknown) => {
    const validSrcPath = validatePath(srcPath, 'srcPath')
    const validDestPath = validatePath(destPath, 'destPath')
    await secureFs.copyFile(validSrcPath, validDestPath)
    return true
  })

  /**
   * Append data to existing file with security restrictions.
   *
   * Appends to end of file, creating it if it doesn't exist.
   * File must be in allowed directories.
   *
   * @param filePath - Absolute file path
   * @param data - Data to append as string or Buffer
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If path is invalid or append fails
   *
   * @example
   * // Append to log file
   * await window.api.appendFile('C:\\...\\AppData\\...\\custom.log', 'Log entry\\n')
   */
  wrapIpcHandler('fs:append-file', async (_event, filePath: unknown, data: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.appendFile(validPath, data as string | Buffer)
    return true
  })

  /**
   * Rename or move file/directory with security restrictions.
   *
   * Both old and new paths must be in allowed directories.
   * Can be used to move files between allowed directories.
   *
   * @param oldPath - Current absolute path
   * @param newPath - New absolute path
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If paths are invalid or rename fails
   *
   * @example
   * // Rename file
   * await window.api.rename(
   *   'C:\\...\\Downloads\\temp.json',
   *   'C:\\...\\Downloads\\final.json'
   * )
   */
  wrapIpcHandler('fs:rename', async (_event, oldPath: unknown, newPath: unknown) => {
    const validOldPath = validatePath(oldPath, 'oldPath')
    const validNewPath = validatePath(newPath, 'newPath')
    await secureFs.rename(validOldPath, validNewPath)
    return true
  })

  /**
   * Check if file or directory exists.
   *
   * Path must be in allowed directories.
   *
   * @param pathToCheck - Absolute path to check
   * @returns Promise<boolean> - True if exists, false otherwise
   * @throws {Error} - If path is outside allowed directories
   *
   * @example
   * // Check if backup exists
   * const exists = await window.api.fileExists('C:\\...\\AppData\\...\\backup.db')
   */
  wrapIpcHandler('fs:is-exists', async (_event, pathToCheck: unknown) => {
    const validPath = validatePath(pathToCheck, 'path')
    return await secureFs.isExists(validPath)
  })

  /**
   * Create directory with security restrictions.
   *
   * Creates directory and all parent directories (like mkdir -p).
   * Directory must be in allowed paths.
   *
   * @param dirPath - Absolute directory path to create
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If path is invalid or creation fails
   *
   * @example
   * // Create nested directories
   * await window.api.mkdir('C:\\...\\Downloads\\manga\\series-name')
   */
  wrapIpcHandler('fs:mkdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    await secureFs.mkdir(validPath)
    return true
  })

  /**
   * Delete file with security restrictions.
   *
   * Permanently deletes file from disk. File must be in allowed directories.
   *
   * @param filePath - Absolute file path to delete
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If path is invalid, file doesn't exist, or deletion fails
   *
   * @example
   * // Delete temporary file
   * await window.api.deleteFile('C:\\...\\AppData\\...\\temp.dat')
   */
  wrapIpcHandler('fs:unlink', async (_event, filePath: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.deleteFile(validPath)
    return true
  })

  /**
   * Delete directory with security restrictions.
   *
   * Deletes directory and optionally all contents recursively.
   * Directory must be in allowed paths.
   *
   * @param dirPath - Absolute directory path to delete
   * @param options - Options object with recursive?: boolean (default: false)
   * @returns Promise<boolean> - Always returns true on success
   * @throws {Error} - If path is invalid, directory not empty (when not recursive), or deletion fails
   *
   * @example
   * // Delete empty directory
   * await window.api.deleteDir('C:\\...\\Downloads\\empty-folder')
   *
   * @example
   * // Delete directory and all contents
   * await window.api.deleteDir('C:\\...\\Downloads\\manga\\old-series', { recursive: true })
   */
  wrapIpcHandler('fs:rmdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    await secureFs.deleteDir(validPath)
    return true
  })

  /**
   * Get file or directory statistics.
   *
   * Returns metadata about file/directory. Path must be in allowed directories.
   *
   * @param pathToStat - Absolute path to file or directory
   * @returns Promise<{isFile: boolean, isDirectory: boolean, size: number, created: string, modified: string}> - Serialized file stats
   * @throws {Error} - If path is invalid or stat fails
   *
   * @example
   * // Get file size and dates
   * const stats = await window.api.stat('C:\\...\\Downloads\\manga.cbz')
   * console.log(`${stats.size} bytes, modified ${stats.modified}`)
   */
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

  /**
   * Read directory contents with security restrictions.
   *
   * Lists files and subdirectories in directory. Directory must be in allowed paths.
   *
   * @param dirPath - Absolute directory path to read
   * @returns Promise<string[]> - Array of file/directory names (not full paths)
   * @throws {Error} - If path is invalid or read fails
   *
   * @example
   * // List manga folders
   * const folders = await window.api.readDir('C:\\...\\Downloads\\manga')
   * console.log(folders) // ['series-1', 'series-2', ...]
   */
  wrapIpcHandler('fs:readdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    return await secureFs.readDir(validPath)
  })

  /**
   * Get allowed filesystem paths for security-restricted operations.
   *
   * Returns the two directories where file operations are permitted:
   * - AppData: Application data directory (read/write settings, database, cache)
   * - Downloads: User-configured downloads directory for manga storage
   *
   * @returns Promise<{appData: string, downloads: string}> - Absolute paths to allowed directories
   *
   * @example
   * // Get allowed paths for validation
   * const paths = await window.api.getAllowedPaths()
   * console.log('AppData:', paths.appData)
   * console.log('Downloads:', paths.downloads)
   */
  /**
   * Get allowed filesystem paths for security-restricted operations.
   *
   * Returns the two directories where file operations are permitted:
   * - AppData: Application data directory (read/write settings, database, cache)
   * - Downloads: User-configured downloads directory for manga storage
   *
   * @returns Promise<{appData: string, downloads: string}> - Absolute paths to allowed directories
   *
   * @example
   * // Get allowed paths for validation
   * const paths = await window.api.getAllowedPaths()
   * console.log('AppData:', paths.appData)
   * console.log('Downloads:', paths.downloads)
   */
  wrapIpcHandler('fs:get-allowed-paths', async () => {
    return {
      appData: getAppDataPath(),
      downloads: getDownloadsPath()
    }
  })

  /**
   * Show native folder picker to select downloads directory.
   *
   * Displays a system folder selection dialog for choosing where to save downloaded manga.
   * Validates and saves the selected path to application settings. Path must be accessible
   * and writable.
   *
   * @returns Promise<{cancelled: boolean, filePath?: string}> - Selected path, or cancelled: true if user cancelled
   * @throws {Error} - If selected path cannot be validated or set
   *
   * @example
   * // Let user choose downloads folder
   * const result = await window.api.selectDownloadsFolder()
   * if (!result.cancelled) {
   *   console.log('Downloads will be saved to:', result.filePath)
   * }
   */
  wrapIpcHandler('fs:select-downloads-folder', async () => {
    const mainWindow = getWindow()
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
      // Validate the selected path without persisting to settings
      // This allows SettingsView to track it as an unsaved change
      await settingsManager.validateDownloadsPath(selectedPath)
      return { cancelled: false, filePath: selectedPath }
    } catch (error) {
      throw new Error(`Unable to set downloads folder: ${toError(error).message}`)
    }
  })

  /**
   * Open downloads folder in system file explorer.
   *
   * Opens the user-configured downloads directory using the system's default file manager
   * (Windows Explorer, macOS Finder, Linux file manager). Useful for accessing downloaded
   * manga files manually.
   *
   * @returns Promise<boolean> - Always returns true on success
   *
   * @example
   * // Open downloads folder from menu
   * await window.api.openDownloadsFolder()
   */
  wrapIpcHandler('fs:open-downloads-folder', async () => {
    const downloadsPath = getDownloadsPath()
    await shell.openPath(downloadsPath)
    return true
  })
}
