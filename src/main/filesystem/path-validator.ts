import path from 'node:path'
import { app } from 'electron'
import fs from 'node:fs/promises'
import { mainLog } from '../services/logging/main-logging.service'

interface IAllowedPath {
  appData: string
  downloads: string
  cachedCover: string
  logs: string
}

// Define allowed paths
// Lazy-loaded to avoid accessing app.getPath() before Electron is ready
let allowedPaths: IAllowedPath | undefined = undefined

function initializePaths(): IAllowedPath {
  if (!allowedPaths) {
    // Use home directory pattern (like VS Code's .vscode/)
    // This separates user data from Electron's internal userData files
    // Windows: C:\Users\<user>\.dexreader
    // macOS: ~/.dexreader
    // Linux: ~/.dexreader
    const homeDir = app.getPath('home')
    const appDataRoot = path.join(homeDir, '.dexreader')
    const appLogs = path.join(app.getPath('userData'), 'logs')

    allowedPaths = {
      appData: appDataRoot,
      downloads: path.join(appDataRoot, 'downloads'),
      cachedCover: path.join(appDataRoot, 'cache', 'covers'),
      logs: appLogs
    }
  }

  return allowedPaths
}

// Get the application data path
export function getAppDataPath(): string {
  return initializePaths().appData
}

// Get the downloads path
export function getDownloadsPath(): string {
  return initializePaths().downloads
}

export function getCachedCoverPath(): string {
  return initializePaths().cachedCover
}

// Update the downloads path in memory (should be called by settingsManager after validation)
export function updateDownloadsPath(newPath: string): void {
  const paths = initializePaths()
  const normalized = normalizePath(newPath)
  mainLog.debug(`[PathValidator] Downloads path updated to: ${normalized}`)
  paths.downloads = normalized
}

// Validate that a path exists and is a directory
export async function validateDirectoryPath(dirPath: string): Promise<void> {
  const normalized = normalizePath(dirPath)

  try {
    const stats = await fs.stat(normalized)

    if (!stats.isDirectory()) {
      mainLog.warn(`[PathValidator] Path is not a directory: ${dirPath}`)
      throw new Error(`The path "${dirPath}" is not a directory.`)
    }
    mainLog.debug(`[PathValidator] Directory validated: ${dirPath}`)
  } catch (error) {
    mainLog.error(`[PathValidator] Directory validation failed for ${dirPath}:`, error)
    throw new Error(`The path "${dirPath}" does not exist or is not accessible. Error: ${error}`)
  }
}

export async function validatePath(inputPath: string): Promise<string> {
  const normalizedPath = normalizePath(inputPath)

  if (!(await isPathAllowed(normalizedPath))) {
    mainLog.warn(`[PathValidator] Access denied to path: ${inputPath}`)
    throw new Error(`Access to the path "${inputPath}" is not allowed.`)
  }

  return normalizedPath
}

function normalizePath(inputPath: string): string {
  return path.normalize(path.resolve(inputPath))
}

// A path is only "within" an allowed root if it equals that root or is a proper
// child of it (separator-bounded) - plain startsWith() also matches sibling
// directories that merely share a prefix, e.g. ".dexreader-evil" vs ".dexreader".
function isWithinAllowedRoot(candidatePath: string, allowedRoot: string): boolean {
  return candidatePath === allowedRoot || candidatePath.startsWith(allowedRoot + path.sep)
}

// Resolves symlinks along a path that may not exist yet: walks up to the deepest
// existing ancestor, realpath()s that ancestor, then re-appends the not-yet-created
// remainder. fs.realpath() itself throws on a non-existent path, which would
// otherwise break every write/mkdir of a new file or directory in the sandbox.
async function resolveRealPath(normalizedInputPath: string): Promise<string> {
  let existingPath = normalizedInputPath
  const remainder: string[] = []

  while (true) {
    try {
      await fs.access(existingPath)
      break
    } catch {
      const parent = path.dirname(existingPath)
      if (parent === existingPath) {
        // Reached filesystem root without finding an existing ancestor
        break
      }
      remainder.unshift(path.basename(existingPath))
      existingPath = parent
    }
  }

  const realExistingPath = await fs.realpath(existingPath)
  return remainder.length > 0 ? path.join(realExistingPath, ...remainder) : realExistingPath
}

async function isPathAllowed(inputPath: string): Promise<boolean> {
  const paths = initializePaths()
  const normalizedInputPath = normalizePath(inputPath)

  const realResolvedPath = await resolveRealPath(normalizedInputPath)

  // If resolving symlinks changes the path, either the target itself or one of its
  // existing ancestors is a symlink that could redirect outside the sandbox roots.
  if (realResolvedPath !== normalizedInputPath) {
    mainLog.warn(`[PathValidator] Possible symlink detected: ${inputPath} -> ${realResolvedPath}`)
    return false
  }

  const isAllowed = Object.values(paths).some((allowedRoot) =>
    isWithinAllowedRoot(normalizedInputPath, allowedRoot)
  )

  if (!isAllowed) {
    mainLog.warn(`[PathValidator] Path not allowed: ${inputPath}`)
  }

  return isAllowed
}
