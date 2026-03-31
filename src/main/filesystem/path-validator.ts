import path from 'node:path'
import app from 'electron'
import fs from 'node:fs/promises'

interface IAllowedPath {
  appData: string
  downloads: string
  cachedCover: string
}

// Define allowed paths
// Lazy-loaded to avoid accessing app.getPath() before Electron is ready
let allowedPaths: IAllowedPath | undefined = undefined

function initializePaths(): void {
  if (!allowedPaths) {
    allowedPaths = {
      appData: path.join(app.app.getPath('userData'), 'dexreader'),
      downloads: path.join(app.app.getPath('userData'), 'dexreader', 'downloads'),
      cachedCover: path.join(app.app.getPath('userData'), 'dexreader', 'cached', 'covers')
    }
  }
}

// Get the application data path
export function getAppDataPath(): string {
  initializePaths()
  return allowedPaths!.appData
}

// Get the downloads path
export function getDownloadsPath(): string {
  initializePaths()
  return allowedPaths!.downloads
}

export function getCachedCoverPath(): string {
  initializePaths()
  return allowedPaths!.cachedCover
}

// Update the downloads path in memory (should be called by settingsManager after validation)
export function updateDownloadsPath(newPath: string): void {
  initializePaths()
  const normalized = normalizePath(newPath)
  allowedPaths!.downloads = normalized
}

// Validate that a path exists and is a directory
export async function validateDirectoryPath(dirPath: string): Promise<void> {
  const normalized = normalizePath(dirPath)

  try {
    const stats = await fs.stat(normalized)

    if (!stats.isDirectory()) {
      throw new Error(`The path "${dirPath}" is not a directory.`)
    }
  } catch (error) {
    throw new Error(`The path "${dirPath}" does not exist or is not accessible. Error: ${error}`)
  }
}

export function validatePath(inputPath: string): string {
  const normalizedPath = normalizePath(inputPath)

  if (!isPathAllowed(normalizedPath)) {
    throw new Error(`Access to the path "${inputPath}" is not allowed.`)
  }

  return normalizedPath
}

function normalizePath(inputPath: string): string {
  return path.normalize(path.resolve(inputPath))
}

function isPathAllowed(inputPath: string): boolean {
  initializePaths()
  const normalizedInputPath = normalizePath(inputPath)

  // Always allow paths within appData
  if (normalizedInputPath.startsWith(allowedPaths!.appData)) {
    return true
  }

  // If downloads path is outside appData (custom location), check it separately
  // Note: This ensures we only allow the exact downloads directory tree, not parent directories
  if (normalizedInputPath.startsWith(allowedPaths!.downloads)) {
    return true
  }

  // Cover caching folder, this isn't changed, and won't be changed by users, but we want to ensure it's always allowed
  if (normalizedInputPath.startsWith(allowedPaths!.cachedCover)) {
    return true
  }

  return false
}
