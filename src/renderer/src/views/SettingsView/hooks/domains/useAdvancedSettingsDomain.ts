import { useCallback, useState } from 'react'
import type { AppSettings } from '../../../../../../preload/window.types'
import type { SettingsDomain } from './settingsDomain.types'

export interface AdvancedPayload {
  update: {
    autoCheck: boolean
    autoDownload: boolean
  }
  logs: {
    retentionInDays: number
  }
  system: {
    useHardwareAcceleration: boolean
  }
}

interface UseAdvancedSettingsDomainParams {
  markSettingModified: (key: string) => void
}

export interface UseAdvancedSettingsDomainResult extends SettingsDomain<AdvancedPayload> {
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
 * Owns the "Advanced" section's three settings domains (update, logs, system).
 * They're combined into a single hook since they're presented together in the
 * UI and none needs an independently-visible dirty flag - only the combined
 * "is anything in Advanced dirty" signal is used.
 */
export function useAdvancedSettingsDomain(
  params: UseAdvancedSettingsDomainParams
): UseAdvancedSettingsDomainResult {
  const { markSettingModified } = params

  const [autoCheckForUpdates, setAutoCheckForUpdates] = useState<boolean>(true)
  const [autoDownloadUpdates, setAutoDownloadUpdates] = useState<boolean>(false)
  const [logRetentionDays, setLogRetentionDays] = useState<number>(7)
  const [useHardwareAcceleration, setUseHardwareAcceleration] = useState<boolean>(true)

  const handleAutoCheckChange = useCallback(
    (enabled: boolean): void => {
      setAutoCheckForUpdates(enabled)
      markSettingModified('autoCheckForUpdates')
    },
    [markSettingModified]
  )

  const handleAutoDownloadChange = useCallback(
    (enabled: boolean): void => {
      setAutoDownloadUpdates(enabled)
      markSettingModified('autoDownloadUpdates')
    },
    [markSettingModified]
  )

  const handleLogRetentionDaysChange = useCallback(
    (days: number): void => {
      setLogRetentionDays(days)
      markSettingModified('logRetentionDays')
    },
    [markSettingModified]
  )

  const handleHardwareAccelerationChange = useCallback(
    (enabled: boolean): void => {
      setUseHardwareAcceleration(enabled)
      markSettingModified('useHardwareAcceleration')
    },
    [markSettingModified]
  )

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

  const isDirty = useCallback(
    (original: AppSettings): boolean =>
      autoCheckForUpdates !== original.update.autoCheck ||
      autoDownloadUpdates !== original.update.autoDownload ||
      logRetentionDays !== (original.logs?.retentionInDays ?? 7) ||
      useHardwareAcceleration !== (original.system?.useHardwareAcceleration ?? true),
    [autoCheckForUpdates, autoDownloadUpdates, logRetentionDays, useHardwareAcceleration]
  )

  const buildPayload = useCallback(
    (): AdvancedPayload => ({
      update: {
        autoCheck: autoCheckForUpdates,
        autoDownload: autoDownloadUpdates
      },
      logs: {
        retentionInDays: logRetentionDays
      },
      system: {
        useHardwareAcceleration
      }
    }),
    [autoCheckForUpdates, autoDownloadUpdates, logRetentionDays, useHardwareAcceleration]
  )

  const reset = useCallback((original: AppSettings): void => {
    setAutoCheckForUpdates(original.update.autoCheck ?? true)
    setAutoDownloadUpdates(original.update.autoDownload ?? false)
    setLogRetentionDays(original.logs?.retentionInDays ?? 7)
    setUseHardwareAcceleration(original.system?.useHardwareAcceleration ?? true)
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
    loadFromSettings,
    isDirty,
    buildPayload,
    reset
  }
}
