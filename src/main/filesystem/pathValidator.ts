import path from 'node:path'
import app from 'electron'
import fs from 'node:fs/promises'

interface IAllowedPath {
  appData: string
  downloads: string
}

// Define allowed paths
// By default, allow app data and a downloads folder within app data
const allowedPaths: IAllowedPath = {
  appData: app.app.getPath('userData'),
  downloads: path.join(app.app.getPath('userData'), 'downloads')
}

// Get the application data path
export function getAppDataPath(): string {
  return allowedPaths.appData
}

// Get the downloads path
export function getDownloadsPath(): string {
  return allowedPaths.downloads
}

// Update the downloads path in memory (should be called by settingsManager after validation)
export function updateDownloadsPath(newPath: string): void {
  const normalized = normalizePath(newPath)
  allowedPaths.downloads = normalized
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
  const normalizedInputPath = normalizePath(inputPath)

  // Always allow paths within appData
  if (normalizedInputPath.startsWith(allowedPaths.appData)) {
    return true
  }

  // If downloads path is outside appData (custom location), check it separately
  // Note: This ensures we only allow the exact downloads directory tree, not parent directories
  if (normalizedInputPath.startsWith(allowedPaths.downloads)) {
    return true
  }

  return false
}
