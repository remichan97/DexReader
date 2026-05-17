import React, { useState } from 'react'
import { Radio, RadioGroup } from '@renderer/components/Radio'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

interface LoggingSettingsProps {
  readonly retentionDays: number
  readonly onRetentionDaysChange: (days: number) => void
}

export function LoggingSettings({
  retentionDays,
  onRetentionDaysChange
}: LoggingSettingsProps): React.JSX.Element {
  const { t } = useTranslation(['settings', 'common', 'errors', 'dialogs'])
  const showToast = useToastStore((state) => state.show)
  const [isDeletingOld, setIsDeletingOld] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isOpeningFolder, setIsOpeningFolder] = useState(false)

  const handleRetentionChange = (value: string): void => {
    const days = Number.parseInt(value, 10)
    onRetentionDaysChange(days)
  }

  const handleOpenLogsFolder = async (): Promise<void> => {
    setIsOpeningFolder(true)
    try {
      const folderPath = await globalThis.logger.openLogsFolder()
      rendererLog.info('[LoggingSettings] Opened logs folder:', folderPath)
    } catch (error) {
      rendererLog.error('[LoggingSettings] Failed to open logs folder:', error)
      showToast({
        variant: 'error',
        title: t('errors:logs.open_failed.title'),
        message: t('errors:logs.open_failed.message'),
        duration: 4000
      })
    } finally {
      setIsOpeningFolder(false)
    }
  }

  const handleDeleteOldLogs = async (): Promise<void> => {
    // Show confirmation dialog
    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.deleteOldLogs.title', { days: retentionDays }),
      t('dialogs:confirmations.deleteOldLogs.message', { days: retentionDays })
    )

    if (!confirmed.success || !confirmed.data) {
      return
    }

    setIsDeletingOld(true)
    try {
      await globalThis.logger.cleanupLogs(false) // forceCleanup = false (only old logs)
      rendererLog.info('[LoggingSettings] Old logs deleted successfully')
      showToast({
        variant: 'success',
        title: t('settings:logging.deleteOldSuccess'),
        message: t('settings:logging.deletedOldLogs', { days: retentionDays }),
        duration: 3000
      })
    } catch (error) {
      rendererLog.error('[LoggingSettings] Failed to delete old logs:', error)
      showToast({
        variant: 'error',
        title: t('errors:logs.delete_old_failed.title'),
        message: t('errors:logs.delete_old_failed.message'),
        duration: 4000
      })
    } finally {
      setIsDeletingOld(false)
    }
  }

  const handleClearLogs = async (): Promise<void> => {
    // Show confirmation dialog
    const confirmed = await globalThis.api.showConfirmDialog(
      t('dialogs:confirmations.clearAllLogs.title'),
      t('dialogs:confirmations.clearAllLogs.message')
    )

    if (!confirmed.success || !confirmed.data) {
      return
    }

    setIsClearing(true)
    try {
      await globalThis.logger.cleanupLogs(true) // forceCleanup = true
      rendererLog.info('[LoggingSettings] All logs cleared successfully')
      showToast({
        variant: 'success',
        title: t('settings:logging.clearAllSuccess'),
        message: t('settings:logging.clearedAllLogs'),
        duration: 3000
      })
    } catch (error) {
      rendererLog.error('[LoggingSettings] Failed to clear logs:', error)
      showToast({
        variant: 'error',
        title: t('errors:logs.clear_failed.title'),
        message: t('errors:logs.clear_failed.message'),
        duration: 4000
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="py-4 flex flex-col gap-5">
      {/* Logging Section */}
      <div className="settings-view__section">
        <h2 className="settings-view__section-heading">{t('settings:logging.sectionTitle')}</h2>
        <p className="settings-view__section-description">
          {t('settings:logging.sectionDescription')}
        </p>

        <div className="flex flex-col gap-4">
          {/* Log Retention Period */}
          <div className="flex flex-col gap-2">
            <RadioGroup
              name="log-retention"
              value={retentionDays.toString()}
              onChange={handleRetentionChange}
              orientation="horizontal"
              label={t('settings:logging.retentionLabel')}
            >
              <Radio value="3" label={t('settings:logging.retentionOptions.3')} />
              <Radio value="7" label={t('settings:logging.retentionOptions.7')} />
              <Radio value="14" label={t('settings:logging.retentionOptions.14')} />
              <Radio value="30" label={t('settings:logging.retentionOptions.30')} />
            </RadioGroup>
          </div>

          {/* Log Management Actions */}
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="secondary"
              onClick={handleOpenLogsFolder}
              disabled={isOpeningFolder}
              loading={isOpeningFolder}
            >
              {t('settings:logging.openFolderButton')}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDeleteOldLogs}
              disabled={isDeletingOld}
              loading={isDeletingOld}
            >
              {t('settings:logging.deleteOldButton')}
            </Button>
            <Button
              variant="danger"
              onClick={handleClearLogs}
              disabled={isClearing}
              loading={isClearing}
            >
              {t('settings:logging.clearAllButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
