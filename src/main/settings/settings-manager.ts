import os from 'node:os'
import { ChapterCacheTier } from './enums/chapter-cache-tier.enum'
import {
  getDownloadsPath,
  updateDownloadsPath,
  validateDirectoryPath
} from '../filesystem/path-validator'
import { ImageQuality } from '../api/enums'
import { AppTheme } from './enums/theme-mode.enum'
import { ReadingMode } from './enums/reading-mode.enum'
import { AppSettings } from './entities/app-settings.entity'
import type Store from 'electron-store'
import { MangaReadingSettings } from './entities/reading-settings.entity'
import { readerSettingsRepo } from '../database/repositories/reader-settings.repo'
import { DownloadConfirmation } from './enums/download-confirmation.enum'
import { MemoryTierInfo } from './response/memory-tier.response'
import { memoryCacheUtil } from '../api/utils/memory-cache.util'
import { mainLog } from '../services/logging/main-logging.service'
import { StartupPage } from './enums/startup-page.enum'
import { CURRENT_SETTINGS_VERSION, migrateSettings } from './utils/settings-migration.util'
import { DisplayLanguage } from './enums/display-languages.enum'

class SettingsManager {
  private settingsStore!: Store<AppSettings>
  private initPromise: Promise<void>

  constructor() {
    this.initPromise = this.initialize()
  }

  // TODO: Dynamic importing isn't my cup of tea, consider moving the whole project to transpile to ESM and using native imports for better readability and maintainability
  private async initialize(): Promise<void> {
    // Dynamic import for ES module (electron-store v11+)
    const Store = (await import('electron-store')).default
    this.settingsStore = new Store<AppSettings>({
      name: 'settings',
      defaults: SettingsManager.getDefaultSettings(),
      clearInvalidConfig: true
    })
  }

  private async ensureInitialized(): Promise<void> {
    await this.initPromise
  }

  async load(): Promise<AppSettings> {
    await this.ensureInitialized()
    const settings = this.settingsStore.store

    if (settings.version !== CURRENT_SETTINGS_VERSION) {
      const migrated = migrateSettings(settings, SettingsManager.getDefaultSettings())
      mainLog.info(
        `[SettingsManager] Settings migrated from version ${settings.version} to ${migrated.version}. Saving migrated settings.`
      )
      this.settingsStore.store = migrated
      return migrated
    }

    return settings
  }

  async getByPath<K extends keyof AppSettings>(key: K, path?: string): Promise<unknown> {
    await this.ensureInitialized()
    const section = this.settingsStore.store[key]

    if (!path) {
      return section
    }

    const pathParts = path.split('.')
    let current: unknown = section

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        if (key === 'downloads' && path === 'downloadPath') {
          return getDownloadsPath()
        }
        mainLog.warn(`[SettingsManager] Path '${path}' not found in section '${key}'`)
        return undefined // No such settings, or path is invalid
      }
    }

    return current
  }

  async update<T extends keyof AppSettings>(section: T, value: AppSettings[T]): Promise<void> {
    await this.ensureInitialized()
    mainLog.debug(`[SettingsManager] Updating setting '${section}'`)
    const currentSettings = this.settingsStore.store
    this.settingsStore.store = {
      ...currentSettings,
      [section]: value
    }
    mainLog.info(`[SettingsManager] Setting '${section}' updated successfully`)
  }

  async save(settings: AppSettings): Promise<void> {
    await this.ensureInitialized()
    this.settingsStore.store = settings
    mainLog.info('[SettingsManager] Settings saved successfully.')
  }

  async reset(): Promise<void> {
    await this.ensureInitialized()
    this.settingsStore.clear()
    mainLog.info('[SettingsManager] Settings reset to defaults.')
  }

  async openSettingsFile(): Promise<void> {
    await this.ensureInitialized()
    return this.settingsStore.openInEditor()
  }

  async setDownloadsPath(newPath: string): Promise<void> {
    await this.ensureInitialized()
    mainLog.info(`[SettingsManager] Attempting to set downloads path: ${newPath}`)
    // Sanitize the new path (remove control characters including null bytes)
    // eslint-disable-next-line no-control-regex
    const sanitizedPath = newPath.replaceAll(/[\u0000-\u001F\u007F]/g, '')

    if (sanitizedPath !== newPath) {
      mainLog.warn('[SettingsManager] Path was sanitized (removed control characters)')
    }

    // Prevent setting to system directories
    if (this.isSystemDirectory(sanitizedPath)) {
      mainLog.error(`[SettingsManager] Rejected system directory: ${sanitizedPath}`)
      throw new Error('Setting downloads path to system directories is not allowed.')
    }

    // Validate that the path exists and is a directory
    await validateDirectoryPath(sanitizedPath)
    mainLog.info('[SettingsManager] Path validation successful')

    // Update in-memory allowed paths
    updateDownloadsPath(sanitizedPath)
    // Save to settings
    const currentSettings = this.settingsStore.store
    this.settingsStore.store = {
      ...currentSettings,
      downloads: {
        ...currentSettings.downloads,
        downloadPath: sanitizedPath
      }
    }
    mainLog.info(`[SettingsManager] Downloads path changed to: ${sanitizedPath}`)
  }

  async initializeDownloadsPath(): Promise<void> {
    const settings = await this.load()

    if (settings.downloads.downloadPath) {
      try {
        await validateDirectoryPath(settings.downloads.downloadPath)
        updateDownloadsPath(settings.downloads.downloadPath)
      } catch (error) {
        mainLog.warn(`[SettingsManager] Failed to set saved downloads path: ${error}`)
        mainLog.info(
          `[SettingsManager] Using default downloads path at ${getDownloadsPath()} instead.`
        )
        // Reset to default in settings
        await this.update('downloads', { ...settings.downloads, downloadPath: undefined })
      }
    }
  }

  async getMangaReaderSettings(mangaId: string): Promise<MangaReadingSettings> {
    const override = readerSettingsRepo.getMangaOverride(mangaId)

    if (override) {
      return override
    }

    await this.ensureInitialized()
    const settings = this.settingsStore.store
    return settings.reader.global
  }

  getMemoryTierInfo(): MemoryTierInfo {
    const memoryTier = memoryCacheUtil.getDynamicTiers()
    const systemMemory = os.totalmem()
    const systemRAM_GB = Number((systemMemory / 1024 ** 3).toFixed(1))

    return {
      lowTierMB: Math.floor(memoryTier[ChapterCacheTier.Low] / (1024 * 1024)),
      normalTierMB: Math.floor(memoryTier[ChapterCacheTier.Normal] / (1024 * 1024)),
      highTierMB: Math.floor(memoryTier[ChapterCacheTier.High] / (1024 * 1024)),
      recommendedMaxMB: Math.floor((systemMemory / (1024 * 1024)) * 0.1), // True 10% without cap
      systemRAM_GB
    }
  }

  static getDefaultSettings(): AppSettings {
    return {
      version: CURRENT_SETTINGS_VERSION,
      downloads: {
        maxConcurrentDownloads: 3,
        shouldConfirmDownload: DownloadConfirmation.BatchDownload,
        defaultQuality: ImageQuality.High,
        maxDiskCacheSize: 50 * 1024 * 1024 // 50 MB default cache size for covers
      },
      appearance: {
        theme: AppTheme.System,
        startupPage: StartupPage.Browse
      },
      reader: {
        forceDarkMode: true,
        quality: ImageQuality.High,
        global: {
          readingMode: ReadingMode.SinglePage
        },
        performance: {
          cacheTier: ChapterCacheTier.Normal
        }
      },
      update: {
        autoCheck: true,
        autoDownload: false
      },
      logs: {
        retentionInDays: 7 // Default: 7 days (covers 99% of debugging scenarios)
      },
      search: {},
      language: {
        displayLanguage: DisplayLanguage.EnglishUK,
        syncContentLanguage: true
      }
    }
  }

  private isSystemDirectory(folderPath: string): boolean {
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
}
export const settingsManager = new SettingsManager()
