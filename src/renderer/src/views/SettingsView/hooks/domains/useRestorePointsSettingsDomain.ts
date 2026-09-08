import { useCallback, useState } from 'react'
import type { AppSettings } from '../../../../../../preload/window.types'
import type { SettingsDomain } from './settingsDomain.types'

const DEFAULT_INTERVAL_HOURS = 6
const DEFAULT_MAX_SNAPSHOTS_COUNT = 5

export interface RestorePointsPayload {
  snapshot: {
    isEnabled: boolean
    intervalInHours: number
    maxSnapshotsCount: number
  }
}

interface UseRestorePointsSettingsDomainParams {
  markSettingModified: (key: string) => void
}

export interface UseRestorePointsSettingsDomainResult extends SettingsDomain<RestorePointsPayload> {
  isEnabled: boolean
  intervalInHours: number
  maxSnapshotsCount: number
  handleEnabledChange: (enabled: boolean) => void
  handleIntervalChange: (hours: number) => void
  handleMaxCountChange: (count: number) => void
  loadFromSettings: (settings: AppSettings) => void
}

/**
 * Owns the "Restore Points" section's buffered settings (isEnabled,
 * intervalInHours, maxSnapshotsCount). The restore-point list itself and the
 * create/delete/restore actions are NOT buffered here - they call the
 * snapshot IPC channels directly and take effect immediately, the same way
 * StorageManagementSettings and LoggingSettings' log actions do.
 */
export function useRestorePointsSettingsDomain(
  params: UseRestorePointsSettingsDomainParams
): UseRestorePointsSettingsDomainResult {
  const { markSettingModified } = params

  const [isEnabled, setIsEnabled] = useState(false)
  const [intervalInHours, setIntervalInHours] = useState(DEFAULT_INTERVAL_HOURS)
  const [maxSnapshotsCount, setMaxSnapshotsCount] = useState(DEFAULT_MAX_SNAPSHOTS_COUNT)

  const handleEnabledChange = useCallback(
    (enabled: boolean): void => {
      setIsEnabled(enabled)
      markSettingModified('restorePointsEnabled')
    },
    [markSettingModified]
  )

  const handleIntervalChange = useCallback(
    (hours: number): void => {
      setIntervalInHours(hours)
      markSettingModified('restorePointsInterval')
    },
    [markSettingModified]
  )

  const handleMaxCountChange = useCallback(
    (count: number): void => {
      setMaxSnapshotsCount(count)
      markSettingModified('restorePointsMaxCount')
    },
    [markSettingModified]
  )

  const loadFromSettings = useCallback((settings: AppSettings): void => {
    if (settings.snapshot) {
      setIsEnabled(settings.snapshot.isEnabled ?? false)
      setIntervalInHours(settings.snapshot.intervalInHours ?? DEFAULT_INTERVAL_HOURS)
      setMaxSnapshotsCount(settings.snapshot.maxSnapshotsCount ?? DEFAULT_MAX_SNAPSHOTS_COUNT)
    }
  }, [])

  const isDirty = useCallback(
    (original: AppSettings): boolean =>
      isEnabled !== (original.snapshot?.isEnabled ?? false) ||
      intervalInHours !== (original.snapshot?.intervalInHours ?? DEFAULT_INTERVAL_HOURS) ||
      maxSnapshotsCount !== (original.snapshot?.maxSnapshotsCount ?? DEFAULT_MAX_SNAPSHOTS_COUNT),
    [isEnabled, intervalInHours, maxSnapshotsCount]
  )

  const buildPayload = useCallback(
    (): RestorePointsPayload => ({
      snapshot: {
        isEnabled,
        // Defends the IPC boundary: guarantees the validator never sees `undefined` for
        // these two fields even if state was ever left unset by a caller bypassing the
        // handlers above (e.g. a future direct setState call added without the fallback).
        intervalInHours: intervalInHours ?? DEFAULT_INTERVAL_HOURS,
        maxSnapshotsCount: maxSnapshotsCount ?? DEFAULT_MAX_SNAPSHOTS_COUNT
      }
    }),
    [isEnabled, intervalInHours, maxSnapshotsCount]
  )

  const reset = useCallback((original: AppSettings): void => {
    setIsEnabled(original.snapshot?.isEnabled ?? false)
    setIntervalInHours(original.snapshot?.intervalInHours ?? DEFAULT_INTERVAL_HOURS)
    setMaxSnapshotsCount(original.snapshot?.maxSnapshotsCount ?? DEFAULT_MAX_SNAPSHOTS_COUNT)
  }, [])

  return {
    isEnabled,
    intervalInHours,
    maxSnapshotsCount,
    handleEnabledChange,
    handleIntervalChange,
    handleMaxCountChange,
    loadFromSettings,
    isDirty,
    buildPayload,
    reset
  }
}
