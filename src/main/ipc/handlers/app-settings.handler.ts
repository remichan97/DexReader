import { AppSettings } from '../../settings/entity/app-settings.entity'
import { loadSettings, updateSettings } from '../../settings/settingsManager'
import {
  isAppearanceSettings,
  isDownloadsSettings,
  isReaderSettings
} from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrapHandler'

export function registerAppSettingsHandlers(): void {
  wrapIpcHandler('settings:load', async () => {
    return await loadSettings()
  })

  wrapIpcHandler('settings:save', async (_, key: unknown, value: unknown) => {
    switch (key as keyof AppSettings) {
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
        throw new Error(`Unknown settings key: ${key as string}`)
    }
    return await updateSettings(key as keyof AppSettings, value)
  })
}
