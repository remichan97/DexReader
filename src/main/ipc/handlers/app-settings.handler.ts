import { AppSettings } from '../../filesystem/enum/app-settings.entity'
import { loadSettings, updateSettings } from '../../filesystem/settingsManager'
import { wrapIpcHandler } from '../wrapHandler'

export function registerAppSettingsHandlers(): void {
  wrapIpcHandler('settings:load', async () => {
    return await loadSettings()
  })

  wrapIpcHandler('settings:save', async (_, key: unknown, value: unknown) => {
    return await updateSettings(key as keyof AppSettings, value as AppSettings[keyof AppSettings])
  })
}
