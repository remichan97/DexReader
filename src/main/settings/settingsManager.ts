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
    return JSON.parse(data)
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

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const settings = await loadSettings()
  return settings[key]
}

// Get the current downloads path (from settings or default)
export async function getConfiguredDownloadsPath(): Promise<string> {
  const settings = await loadSettings()
  return settings.downloads.downloadPath ?? getDownloadsPath()
}

// Set a new downloads path with validation
export async function setDownloadsPath(newPath: string): Promise<void> {
  // Sanitize the new path (remove control characters)
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
  const settings = await loadSettings()
  return settings.reader.manga[mangaId] || settings.reader.global
}

export async function updateMangaReaderSettings(
  mangaId: string,
  newSettings: MangaReadingSettings
): Promise<void> {
  const settings = await loadSettings()
  settings.reader.manga[mangaId] = newSettings
  await updateSettings('reader', settings.reader)
}

export async function deleteMangaReaderSettings(mangaId: string): Promise<void> {
  const settings = await loadSettings()
  delete settings.reader.manga[mangaId]
  await updateSettings('reader', settings.reader)
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
      await updateSettings('downloads', { ...settings.downloads, downloadPath: null })
    }
  }
}

function getDefaultSettings(): AppSettings {
  return {
    downloads: {
      downloadPath: null,
      downloadQuality: ImageQuality.High,
      concurrentChapterDownloads: 3
    },
    appearance: {
      theme: AppTheme.System
    },
    reader: {
      forceDarkMode: true,
      quality: ImageQuality.High,
      global: {
        readingMode: ReadingMode.SinglePage
      },
      manga: {}
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
