import path from 'node:path'
import {
  getAppDataPath,
  getDownloadsPath,
  updateDownloadsPath,
  validateDirectoryPath
} from './pathValidator'
import { secureFs } from './secureFs'
import { ImageQuality } from '../api/enums'

interface AppSettings {
  downloadsPath: string | null
  theme: 'light' | 'dark' | 'system'
  accentColor: string | undefined // Accent color in hex format, e.g., '#FF5733'
  reader: {
    scrollMode: 'paginated' | 'continuous' | 'reverse-paginated'
    imageQuality: ImageQuality
    backgroundColor?: string // Background color in hex format, e.g., '#FFFFFF'
    showPageNumbers?: boolean
    fitMode: 'width' | 'height' | 'actual'
  }
}

const SETTINGS_FILE = path.join(getAppDataPath(), 'settings.json')

export async function loadSettings(): Promise<AppSettings> {
  try {
    const exists = await secureFs.isExists(SETTINGS_FILE)

    if (!exists) {
      const defaults: AppSettings = {
        downloadsPath: null,
        theme: 'system',
        accentColor: undefined,
        reader: {
          scrollMode: 'paginated',
          imageQuality: ImageQuality.High,
          fitMode: 'width'
        }
      }
      await saveSettings(defaults)
      return defaults
    }

    const data = (await secureFs.readFile(SETTINGS_FILE, 'utf-8')) as string
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading settings:', error)
    console.warn('Reverting to default settings.')
    return {
      downloadsPath: null,
      theme: 'system',
      accentColor: undefined,
      reader: {
        scrollMode: 'paginated',
        imageQuality: ImageQuality.High,
        fitMode: 'width'
      }
    }
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
  return settings.downloadsPath ?? getDownloadsPath()
}

// Set a new downloads path with validation
export async function setDownloadsPath(newPath: string): Promise<void> {
  // Validate that the path exists and is a directory
  await validateDirectoryPath(newPath)

  // Update in-memory allowed paths
  updateDownloadsPath(newPath)

  // Save to settings
  await updateSettings('downloadsPath', newPath)
}

// Initialize downloads path from settings on app startup
export async function initializeDownloadsPath(): Promise<void> {
  const settings = await loadSettings()

  if (settings.downloadsPath) {
    try {
      await validateDirectoryPath(settings.downloadsPath)
      updateDownloadsPath(settings.downloadsPath)
    } catch (error) {
      console.warn(`Failed to set saved downloads path: ${error}`)
      console.log(`Using default downloads path at ${getDownloadsPath()} instead.`)
      // Reset to default in settings
      await updateSettings('downloadsPath', null)
    }
  }
}
