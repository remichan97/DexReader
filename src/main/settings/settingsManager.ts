import path from 'node:path'
import {
  getAppDataPath,
  getDownloadsPath,
  updateDownloadsPath,
  validateDirectoryPath
} from '../filesystem/pathValidator'
import { secureFs } from '../filesystem/secureFs'
import { ImageQuality } from '../api/enums'
import { AppTheme } from './enum/theme-mode.enum'
import { ReadingMode } from './enum/reading-mode.enum'
import { AppSettings } from './entity/app-settings.entity'
import { MangaReadingSettings } from './entity/reading-settings.entity'
import { readerSettingsRepo } from '../database/repository/reader-settings.repo'
import { DownloadConfirmation } from './enum/download-confirmation.enum'

const SETTINGS_FILE = path.join(getAppDataPath(), 'settings.json')

export async function loadSettings(): Promise<AppSettings> {
  try {
    const exists = await secureFs.isExists(SETTINGS_FILE)

    if (!exists) {
      const defaults: AppSettings = getDefaultSettings()
      await saveSettings(defaults)
      return defaults
    }

    const data = (await secureFs.readFile(SETTINGS_FILE, 'utf-8')) as string
    const settings = JSON.parse(data)

    return settings
  } catch (error) {
    console.error('Error loading settings:', error)
    console.warn('Reverting to default settings.')
    return getDefaultSettings()
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const data = JSON.stringify(settings, null, 2)

    await secureFs.writeFile(SETTINGS_FILE, data, 'utf-8')
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

export async function updateSettings<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await loadSettings()
  settings[key] = value
  await saveSettings(settings)
}

/**
 * Get a nested setting value by path (e.g., 'downloads.downloadPath')
 * @param section - Top-level settings section ('downloads', 'appearance', 'reader')
 * @param path - Optional dot-notation path to nested property
 * @returns The value at the specified path, or the entire section if no path provided
 */
export async function getSettingByPath<K extends keyof AppSettings>(
  section: K,
  settingsPath?: string
): Promise<unknown> {
  const settings = await loadSettings()
  const settingsData: unknown = settings[section]

  if (!settingsPath) {
    return settingsData
  }

  const keys = settingsPath.split('.')
  let value: unknown = settingsData
  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key]
    if (value === undefined) {
      // Special case: downloadPath defaults to system downloads directory
      if (section === 'downloads' && settingsPath === 'downloadPath') {
        return getDownloadsPath()
      }
      return undefined
    }
  }

  return value
}

/**
 * Set a nested setting value by path (e.g., 'downloads.downloadPath')
 * @param section - Top-level settings section ('downloads', 'appearance', 'reader')
 * @param settingsPath - Dot-notation path to nested property
 * @param value - Value to set
 */
export async function setSettingByPath<K extends keyof AppSettings>(
  section: K,
  settingsPath: string,
  value: unknown
): Promise<void> {
  const settings = await loadSettings()
  const keys = settingsPath.split('.')
  // Navigate to the parent object
  let target = settings[section] as unknown as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) {
    if (target[keys[i]] === undefined) {
      target[keys[i]] = {}
    }
    target = target[keys[i]] as Record<string, unknown>
  }

  // Set the final value
  const finalKey = keys.at(-1)!
  target[finalKey] = value

  await saveSettings(settings)
}

export function getSettingsFilePath(): string {
  return SETTINGS_FILE
}

// Set a new downloads path with validation
export async function setDownloadsPath(newPath: string): Promise<void> {
  // Sanitize the new path (remove control characters including null bytes)
  // eslint-disable-next-line no-control-regex
  const sanitizedPath = newPath.replaceAll(/[\u0000-\u001F\u007F]/g, '')

  // Prevent setting to system directories
  if (isSystemDirectory(sanitizedPath)) {
    throw new Error('Setting downloads path to system directories is not allowed.')
  }

  // Validate that the path exists and is a directory
  await validateDirectoryPath(sanitizedPath)

  // Load and update settings
  const settings = await loadSettings()
  // Update in-memory allowed paths
  updateDownloadsPath(sanitizedPath)
  // Save to settings
  await updateSettings('downloads', { ...settings.downloads, downloadPath: sanitizedPath })
}

export async function getMangaReaderSettings(mangaId: string): Promise<MangaReadingSettings> {
  const override = readerSettingsRepo.getMangaOverride(mangaId)

  if (override) {
    return override
  }

  const settings = await loadSettings()
  return settings.reader.global
}

// Initialize downloads path from settings on app startup
export async function initializeDownloadsPath(): Promise<void> {
  const settings = await loadSettings()

  if (settings.downloads.downloadPath) {
    try {
      await validateDirectoryPath(settings.downloads.downloadPath)
      updateDownloadsPath(settings.downloads.downloadPath)
    } catch (error) {
      console.warn(`Failed to set saved downloads path: ${error}`)
      console.log(`Using default downloads path at ${getDownloadsPath()} instead.`)
      // Reset to default in settings
      await updateSettings('downloads', { ...settings.downloads, downloadPath: undefined })
    }
  }
}

export function getDefaultSettings(): AppSettings {
  return {
    downloads: {
      maxConcurrentDownloads: 3,
      shouldConfirmDownload: DownloadConfirmation.BatchDownload,
      defaultQuality: ImageQuality.High,
      maxDiskCacheSize: 50 * 1024 * 1024 // 50 MB default cache size for covers
    },
    appearance: {
      theme: AppTheme.System
    },
    reader: {
      forceDarkMode: true,
      quality: ImageQuality.High,
      global: {
        readingMode: ReadingMode.SinglePage
      }
    }
  }
}

function isSystemDirectory(folderPath: string): boolean {
  const systemDirs = [
    String.raw`C:\Windows`,
    String.raw`C:\Program Files`,
    '/usr',
    '/bin',
    '/etc',
    '/var',
    '/root',
    '/sys',
    '/proc',
    String.raw`/System`,
    String.raw`/Library`
  ]

  return systemDirs.some((dir) => folderPath.startsWith(dir))
}
