import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Add24Regular, History48Regular } from '@fluentui/react-icons'
import { Switch } from '@renderer/components/Switch'
import { NumberSpinner } from '@renderer/components/NumberSpinner'
import { Button } from '@renderer/components/Button'
import { Badge } from '@renderer/components/Badge'
import { List, ListItem } from '@renderer/components/ListItem'
import { EmptyState } from '@renderer/components/EmptyState'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'
import { formatBytes } from '@renderer/utils/formatBytes'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'
import type { SnapshotItemContract } from '@shared/contracts/services/download-snapshots/snapshot-item.contract'

interface RestorePointsSettingsProps {
  readonly isEnabled: boolean
  readonly intervalInHours: number
  readonly maxSnapshotsCount: number
  readonly onEnabledChange: (enabled: boolean) => void
  readonly onIntervalChange: (hours: number) => void
  readonly onMaxCountChange: (count: number) => void
}

function formatRestorePointDate(date: Date): string {
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function RestorePointsSettings({
  isEnabled,
  intervalInHours,
  maxSnapshotsCount,
  onEnabledChange,
  onIntervalChange,
  onMaxCountChange
}: RestorePointsSettingsProps): JSX.Element {
  const { t } = useTranslation(['settings', 'common', 'errors', 'dialogs'])
  const showToast = useToastStore((state) => state.show)

  const [restorePoints, setRestorePoints] = useState<SnapshotItemContract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)

  const loadRestorePoints = useCallback(async (): Promise<void> => {
    try {
      const response = await globalThis.snapshots.listSnapshots()
      if (response.success && response.data) {
        setRestorePoints(response.data)
      } else {
        showToast({ variant: 'error', title: t('errors:restorePoints.load_failed.title') })
      }
    } catch (error) {
      rendererLog.error('[RestorePointsSettings] Failed to load restore points:', error)
      showToast({
        variant: 'error',
        title: t('errors:restorePoints.load_failed.title'),
        message: error instanceof Error ? error.message : t('common:message.error.unknownError')
      })
    } finally {
      setIsLoading(false)
    }
  }, [showToast, t])

  useEffect(() => {
    loadRestorePoints()
  }, [loadRestorePoints])

  const handleCreateNow = async (): Promise<void> => {
    setIsCreating(true)
    try {
      const response = await globalThis.snapshots.createSnapshot(SnapshotTrigger.Manual)
      if (!response.success) {
        throw new Error(response.error?.message)
      }
      await loadRestorePoints()
      showToast({ variant: 'success', title: t('settings:restorePoints.createSuccess') })
    } catch (error) {
      rendererLog.error('[RestorePointsSettings] Failed to create restore point:', error)
      showToast({
        variant: 'error',
        title: t('errors:restorePoints.create_failed.title'),
        message: error instanceof Error ? error.message : t('common:message.error.unknownError')
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (fileName: string): Promise<void> => {
    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.deleteRestorePoint.title'),
      t('dialogs:confirmations.deleteRestorePoint.message'),
      t('common:button.delete'),
      t('common:button.cancel')
    )
    if (!confirmed.success || !confirmed.data) return

    setPendingFileName(fileName)
    try {
      const response = await globalThis.snapshots.deleteSnapshot(fileName)
      if (!response.success) {
        throw new Error(response.error?.message)
      }
      await loadRestorePoints()
      showToast({ variant: 'success', title: t('settings:restorePoints.deleteSuccess') })
    } catch (error) {
      rendererLog.error('[RestorePointsSettings] Failed to delete restore point:', error)
      showToast({
        variant: 'error',
        title: t('errors:restorePoints.delete_failed.title'),
        message: error instanceof Error ? error.message : t('common:message.error.unknownError')
      })
    } finally {
      setPendingFileName(null)
    }
  }

  const handleRestore = async (fileName: string): Promise<void> => {
    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.restoreToPoint.title'),
      t('dialogs:confirmations.restoreToPoint.message'),
      t('settings:restorePoints.restoreConfirmButton'),
      t('common:button.cancel')
    )
    if (!confirmed.success || !confirmed.data) return

    setPendingFileName(fileName)
    try {
      const response = await globalThis.snapshots.restoreSnapshot(fileName)
      if (!response.success) {
        throw new Error(response.error?.message)
      }
      // On success the app relaunches from the main process - no further UI feedback needed
    } catch (error) {
      rendererLog.error('[RestorePointsSettings] Failed to restore:', error)
      showToast({
        variant: 'error',
        title: t('errors:restorePoints.restore_failed.title'),
        message: error instanceof Error ? error.message : t('common:message.error.unknownError')
      })
      setPendingFileName(null)
    }
  }

  const sortedRestorePoints = restorePoints.toSorted(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  return (
    <div className="py-4 flex flex-col gap-5">
      {/* Restore Point Settings */}
      <div className="settings-view__section">
        <h2 className="settings-view__section-heading">
          {t('settings:restorePoints.sectionTitle')}
        </h2>
        <p className="settings-view__section-description">
          {t('settings:restorePoints.sectionDescription')}
        </p>

        <Switch
          checked={isEnabled}
          onChange={onEnabledChange}
          label={t('settings:restorePoints.enable.label')}
          description={t('settings:restorePoints.enable.description')}
        />

        {isEnabled && (
          <div className="flex gap-6 mt-4">
            <NumberSpinner
              label={t('settings:restorePoints.intervalLabel')}
              value={intervalInHours}
              onChange={onIntervalChange}
              min={1}
              max={6}
              suffix={t('settings:restorePoints.hoursSuffix')}
            />
            <NumberSpinner
              label={t('settings:restorePoints.maxCountLabel')}
              value={maxSnapshotsCount}
              onChange={onMaxCountChange}
              min={1}
              max={5}
            />
          </div>
        )}
      </div>

      {/* Restore Point List */}
      <div className="settings-view__section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="settings-view__section-heading">
            {t('settings:restorePoints.listTitle')}
          </h3>
          <Button
            variant="secondary"
            icon={<Add24Regular />}
            onClick={handleCreateNow}
            disabled={!isEnabled || isCreating}
            loading={isCreating}
          >
            {t('settings:restorePoints.createNowButton')}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-secondary">{t('settings:restorePoints.loading')}</p>
        ) : sortedRestorePoints.length === 0 ? (
          <EmptyState
            icon={<History48Regular />}
            message={t('settings:restorePoints.emptyState')}
          />
        ) : (
          <List>
            {sortedRestorePoints.map((point) => (
              <ListItem
                key={point.fileName}
                leading={
                  <Badge variant={point.trigger === SnapshotTrigger.Auto ? 'info' : 'default'}>
                    {point.trigger === SnapshotTrigger.Auto
                      ? t('settings:restorePoints.trigger.automatic')
                      : t('settings:restorePoints.trigger.manual')}
                  </Badge>
                }
                title={formatRestorePointDate(point.createdAt)}
                subtitle={formatBytes(point.sizeInBytes)}
                trailing={
                  <>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleRestore(point.fileName)}
                      disabled={pendingFileName !== null}
                      loading={pendingFileName === point.fileName}
                    >
                      {t('settings:restorePoints.restoreButton')}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(point.fileName)}
                      disabled={pendingFileName !== null}
                      loading={pendingFileName === point.fileName}
                    >
                      {t('common:button.delete')}
                    </Button>
                  </>
                }
              />
            ))}
          </List>
        )}
      </div>
    </div>
  )
}
