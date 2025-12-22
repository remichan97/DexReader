import { AppSettings } from '../../settings/entity/app-settings.entity'
import { loadSettings, updateSettings, updateSettingsField } from '../../settings/settingsManager'
import {
  isAppearanceSettings,
  isDownloadsSettings,
  isReaderSettings,
  validateSettingsField
} from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrapHandler'

export function registerAppSettingsHandlers(): void {
  wrapIpcHandler('settings:load', async () => {
    return await loadSettings()
  })

  wrapIpcHandler('settings:save', async (_, key: unknown, value: unknown) => {
    const keyStr = key as string

    // Check if this is a field-level update (e.g., 'accentColor', 'theme')
    const fieldUpdateResult = validateSettingsField(keyStr, value)
    if (fieldUpdateResult.isFieldUpdate) {
      // Field-level update with validation
      if (!fieldUpdateResult.isValid) {
        throw new Error(fieldUpdateResult.error || 'Invalid field value')
      }
      return await updateSettingsField(keyStr, value)
    }

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
}
