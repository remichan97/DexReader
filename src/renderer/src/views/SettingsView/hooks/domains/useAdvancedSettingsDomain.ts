import { useCallback, useState } from 'react'
import { writeSettingsSection } from '@renderer/utils/settingsPendingWrites'
import type { AppSettings } from '../../../../../../preload/window.types'

export interface UseAdvancedSettingsDomainResult {
  autoCheckForUpdates: boolean
  autoDownloadUpdates: boolean
  logRetentionDays: number
  useHardwareAcceleration: boolean
  handleAutoCheckChange: (enabled: boolean) => void
  handleAutoDownloadChange: (enabled: boolean) => void
  handleLogRetentionDaysChange: (days: number) => void
  handleHardwareAccelerationChange: (enabled: boolean) => void
  loadFromSettings: (settings: AppSettings) => void
}

/**
 * Owns the "Advanced" section's three settings domains (update, logs, system). Every
 * field writes immediately via settings:update-section. autoCheckForUpdates and
 * autoDownloadUpdates share the `update` section, so each of their handlers sends both
 * fields together; logRetentionDays (`logs`) and useHardwareAcceleration (`system`) are
 * each the sole field in their section.
 */
export function useAdvancedSettingsDomain(): UseAdvancedSettingsDomainResult {
  const [autoCheckForUpdates, setAutoCheckForUpdates] = useState<boolean>(true)
  const [autoDownloadUpdates, setAutoDownloadUpdates] = useState<boolean>(false)
  const [logRetentionDays, setLogRetentionDays] = useState<number>(7)
  const [useHardwareAcceleration, setUseHardwareAcceleration] = useState<boolean>(true)

  const handleAutoCheckChange = useCallback(
    (enabled: boolean): void => {
      setAutoCheckForUpdates(enabled)
      void writeSettingsSection('update', { autoCheck: enabled, autoDownload: autoDownloadUpdates })
    },
    [autoDownloadUpdates]
  )

  const handleAutoDownloadChange = useCallback(
    (enabled: boolean): void => {
      setAutoDownloadUpdates(enabled)
      void writeSettingsSection('update', { autoCheck: autoCheckForUpdates, autoDownload: enabled })
    },
    [autoCheckForUpdates]
  )

  const handleLogRetentionDaysChange = useCallback((days: number): void => {
    setLogRetentionDays(days)
    void writeSettingsSection('logs', { retentionInDays: days })
  }, [])

  const handleHardwareAccelerationChange = useCallback((enabled: boolean): void => {
    setUseHardwareAcceleration(enabled)
    void writeSettingsSection('system', { useHardwareAcceleration: enabled })
  }, [])

  const loadFromSettings = useCallback((settings: AppSettings): void => {
    if (settings.update) {
      setAutoCheckForUpdates(settings.update.autoCheck ?? true)
      setAutoDownloadUpdates(settings.update.autoDownload ?? false)
    }
    if (settings.logs) {
      setLogRetentionDays(settings.logs.retentionInDays ?? 7)
    }
    if (settings.system) {
      setUseHardwareAcceleration(settings.system.useHardwareAcceleration ?? true)
    }
  }, [])

  return {
    autoCheckForUpdates,
    autoDownloadUpdates,
    logRetentionDays,
    useHardwareAcceleration,
    handleAutoCheckChange,
    handleAutoDownloadChange,
    handleLogRetentionDaysChange,
    handleHardwareAccelerationChange,
    loadFromSettings
  }
}
