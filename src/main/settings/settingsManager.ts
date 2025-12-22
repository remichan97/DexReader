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

// Limits to prevent file bloat and save failures
const MAX_SETTINGS_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_MANGA_OVERRIDES = 1000 // Reasonable limit for per-manga settings

export async function loadSettings(): Promise<AppSettings> {
  try {
    const exists = await secureFs.isExists(SETTINGS_FILE)

    if (!exists) {
      const defaults: AppSettings = getDefaultSettings()
      await saveSettings(defaults)
      return defaults
    }

    // Check file size - warn but still load (user data is precious)
    const stats = await secureFs.stat(SETTINGS_FILE)
    if (stats.size > MAX_SETTINGS_FILE_SIZE) {
      console.warn(
        `Settings file is large (${Math.round(stats.size / 1024)}KB). ` +
          `Loading anyway, but consider removing unused manga overrides.`
      )
    }

    const data = (await secureFs.readFile(SETTINGS_FILE, 'utf-8')) as string
    const settings = JSON.parse(data)

    // Check if manga overrides exceed limit - auto-trim to keep file manageable
    if (settings.reader?.manga) {
      const overrideCount = Object.keys(settings.reader.manga).length
      if (overrideCount > MAX_MANGA_OVERRIDES) {
        console.warn(
          `Too many manga overrides (${overrideCount}), trimming to ${MAX_MANGA_OVERRIDES} most recent`
        )
        // Keep only the most recent overrides (slice from end to keep newest)
        const sortedEntries = Object.entries(settings.reader.manga).slice(-MAX_MANGA_OVERRIDES)
        settings.reader.manga = Object.fromEntries(sortedEntries)
        // Save trimmed version to prevent file from growing indefinitely
        await saveSettings(settings)
      }
    }

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

    // Pre-save validation: Check if serialized data would exceed size limit
    const estimatedSize = Buffer.byteLength(data, 'utf-8')
    if (estimatedSize > MAX_SETTINGS_FILE_SIZE) {
      throw new Error(
        `Settings too large (${Math.round(estimatedSize / 1024)}KB). ` +
          `Try removing some per-manga reader overrides.`
      )
    }

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
 * Update a specific field within settings sections
 * Supports granular updates without requiring full section objects
 */
export async function updateSettingsField(field: string, value: unknown): Promise<void> {
  const settings = await loadSettings()

  switch (field) {
    case 'accentColor':
      // Update accent color in appearance section
      settings.appearance.accentColor = value as string | undefined
      break

    case 'theme':
      // Update theme in appearance section
      settings.appearance.theme = value as AppSettings['appearance']['theme']
      break

    default:
      throw new Error(`Unknown settings field: ${field}`)
  }

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
  const settings = await loadSettings()
  return settings.reader.manga[mangaId] || settings.reader.global
}

export async function updateMangaReaderSettings(
  mangaId: string,
  newSettings: MangaReadingSettings
): Promise<void> {
  const settings = await loadSettings()

  // Check if adding this override would exceed the limit
  const currentOverrideCount = Object.keys(settings.reader.manga).length
  const isNewOverride = !settings.reader.manga[mangaId]

  if (isNewOverride && currentOverrideCount >= MAX_MANGA_OVERRIDES) {
    throw new Error(
      `Cannot add more manga overrides. Maximum limit of ${MAX_MANGA_OVERRIDES} reached. ` +
        `Please delete some unused overrides from Settings.`
    )
  }

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
