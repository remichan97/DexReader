import { app, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { AppSettings } from '../../settings/entity/app-settings.entity'
import {
  getDefaultSettings,
  getSettingsFilePath,
  getSettingByPath,
  setSettingByPath,
  loadSettings,
  saveSettings,
  updateSettings
} from '../../settings/settingsManager'
import {
  isAppearanceSettings,
  isDownloadsSettings,
  isReaderSettings
} from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrap-handler'
import { cleanupRepo } from '../../database/repository/cleanup-repo'

export function registerAppSettingsHandlers(): void {
  const validSections: Set<keyof AppSettings> = new Set(['appearance', 'downloads', 'reader'])

  wrapIpcHandler('settings:load', async () => {
    return await loadSettings()
  })

  wrapIpcHandler('settings:get', async (_, section: unknown, path?: unknown) => {
    if (typeof section !== 'string') {
      throw new TypeError('Section must be a string')
    }

    // Validate section is a valid top-level key in AppSettings
    if (!validSections.has(section as keyof AppSettings)) {
      throw new Error(`Unknown settings section: ${section}`)
    }

    if (path !== undefined && typeof path !== 'string') {
      throw new Error('Path must be a string')
    }

    return await getSettingByPath(section as keyof AppSettings, path)
  })

  wrapIpcHandler('settings:set', async (_, section: unknown, path: unknown, value: unknown) => {
    if (typeof section !== 'string') {
      throw new TypeError('Section must be a string')
    }

    if (!validSections.has(section as keyof AppSettings)) {
      throw new Error(`Unknown settings section: ${section}`)
    }

    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    return await setSettingByPath(section as keyof AppSettings, path, value)
  })

  wrapIpcHandler('settings:save', async (_, key: unknown, value: unknown) => {
    const keyStr = key as string

    // Section-level update (e.g., 'appearance', 'downloads', 'reader')
    switch (keyStr as keyof AppSettings) {
      case 'appearance':
        if (!isAppearanceSettings(value)) {
          throw new Error('Invalid appearance settings')
        }
        break
      case 'downloads':
        if (!isDownloadsSettings(value)) {
          throw new Error('Invalid downloads settings')
        }
        break
      case 'reader':
        if (!isReaderSettings(value)) {
          throw new Error('Invalid reader settings')
        }
        break
      default:
        throw new Error(`Unknown settings key: ${keyStr}`)
    }
    return await updateSettings(keyStr as keyof AppSettings, value)
  })

  wrapIpcHandler('settings:open-settings-file', async () => {
    const settingsPath = getSettingsFilePath()

    await shell.openPath(settingsPath)
    return true
  })

  wrapIpcHandler('settings:reset-to-defaults', async () => {
    const defaultSettings = getDefaultSettings()

    await saveSettings(defaultSettings)
    return true
  })

  wrapIpcHandler('settings:clear-all', async () => {
    cleanupRepo.clearAllData()

    const defaultSettings = getDefaultSettings()
    await saveSettings(defaultSettings)

    // In dev mode, just exit. In production, relaunch the app
    if (!is.dev) {
      app.relaunch()
    }
    app.exit(0)
    return true
  })

  wrapIpcHandler('settings:open-system-date-settings', async () => {
    const platform = process.platform

    try {
      if (platform === 'win32') {
        // Windows: Open Region & Language settings
        await shell.openExternal('ms-settings:regionlanguage')
      } else if (platform === 'darwin') {
        // macOS: Open Language & Region in System Preferences
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.international')
      } else {
        // Linux: No universal way, return false to indicate unsupported
        return false
      }
      return true
    } catch (error) {
      console.error('Failed to open system date settings:', error)
      return false
    }
  })
}
