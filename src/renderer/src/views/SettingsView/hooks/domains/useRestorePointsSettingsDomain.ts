import { useCallback, useState } from 'react'
import { writeSettingsSection } from '@renderer/utils/settingsPendingWrites'
import type { AppSettings } from '../../../../../../preload/window.types'

const DEFAULT_INTERVAL_HOURS = 6
const DEFAULT_MAX_SNAPSHOTS_COUNT = 5

export interface UseRestorePointsSettingsDomainResult {
  isEnabled: boolean
  intervalInHours: number
  maxSnapshotsCount: number
  handleEnabledChange: (enabled: boolean) => void
  handleIntervalChange: (hours: number) => void
  handleMaxCountChange: (count: number) => void
  loadFromSettings: (settings: AppSettings) => void
}

/**
 * Owns the "Restore Points" section (isEnabled, intervalInHours, maxSnapshotsCount).
 * Every field writes immediately via settings:update-section - since
 * settingsManager.update() replaces the whole `snapshot` section, each handler sends
 * the complete section (current values for the other two fields, the new value for
 * the one that changed). The restore-point list itself and the create/delete/restore
 * actions are separate direct IPC calls, unrelated to this domain's fields.
 */
export function useRestorePointsSettingsDomain(): UseRestorePointsSettingsDomainResult {
  const [isEnabled, setIsEnabled] = useState(false)
  const [intervalInHours, setIntervalInHours] = useState(DEFAULT_INTERVAL_HOURS)
  const [maxSnapshotsCount, setMaxSnapshotsCount] = useState(DEFAULT_MAX_SNAPSHOTS_COUNT)

  const handleEnabledChange = useCallback(
    (enabled: boolean): void => {
      setIsEnabled(enabled)
      void writeSettingsSection('snapshot', {
        isEnabled: enabled,
        intervalInHours,
        maxSnapshotsCount
      })
    },
    [intervalInHours, maxSnapshotsCount]
  )

  const handleIntervalChange = useCallback(
    (hours: number): void => {
      setIntervalInHours(hours)
      void writeSettingsSection('snapshot', {
        isEnabled,
        intervalInHours: hours,
        maxSnapshotsCount
      })
    },
    [isEnabled, maxSnapshotsCount]
  )

  const handleMaxCountChange = useCallback(
    (count: number): void => {
      setMaxSnapshotsCount(count)
      void writeSettingsSection('snapshot', {
        isEnabled,
        intervalInHours,
        maxSnapshotsCount: count
      })
    },
    [isEnabled, intervalInHours]
  )

  const loadFromSettings = useCallback((settings: AppSettings): void => {
    if (settings.snapshot) {
      setIsEnabled(settings.snapshot.isEnabled ?? false)
      setIntervalInHours(settings.snapshot.intervalInHours ?? DEFAULT_INTERVAL_HOURS)
      setMaxSnapshotsCount(settings.snapshot.maxSnapshotsCount ?? DEFAULT_MAX_SNAPSHOTS_COUNT)
    }
  }, [])

  return {
    isEnabled,
    intervalInHours,
    maxSnapshotsCount,
    handleEnabledChange,
    handleIntervalChange,
    handleMaxCountChange,
    loadFromSettings
  }
}
