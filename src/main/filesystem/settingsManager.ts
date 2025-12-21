import path from 'node:path'
import {
  getAppDataPath,
  getDownloadsPath,
  updateDownloadsPath,
  validateDirectoryPath
} from './pathValidator'
import { secureFs } from './secureFs'
import { ImageQuality } from '../api/enums'
import { AppTheme } from './enum/theme-mode.enum'
import { ReaderSettings } from './entity/reading-settings.entity'
import { ReadingMode } from './enum/reading-mode.enum'
import { AppSettings } from './enum/app-settings.entity'

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
  const settings = await loadSettings()

  // Validate that the path exists and is a directory
  await validateDirectoryPath(newPath)

  // Update in-memory allowed paths
  updateDownloadsPath(newPath)

  // Save to settings
  await updateSettings('downloads', { ...settings.downloads, downloadPath: newPath })
}

export async function getMangaReaderSettings(mangaId: string): Promise<ReaderSettings> {
  const settings = await loadSettings()
  return settings.reader.manga[mangaId] || settings.reader.global
}

export async function updateMangaReaderSettings(
  mangaId: string,
  newSettings: ReaderSettings
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
    theme: AppTheme.System,
    accentColor: undefined,
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
