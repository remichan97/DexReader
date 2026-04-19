import React, { useState } from 'react'
import { Radio, RadioGroup } from '@renderer/components/Radio'
import { Button } from '@renderer/components/Button'
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
        title: 'Failed to open logs folder',
        message: 'Could not open the logs folder. Please try again.',
        duration: 4000
      })
    } finally {
      setIsOpeningFolder(false)
    }
  }

  const handleDeleteOldLogs = async (): Promise<void> => {
    // Show confirmation dialog
    const confirmed = await globalThis.api.showConfirmDialog(
      'Cleanup old logs?',
      `This will permanently delete all log files older than ${retentionDays} days. This action cannot be undone.`
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
        title: 'Old logs deleted',
        message: `Logs older than ${retentionDays} days have been deleted.`,
        duration: 3000
      })
    } catch (error) {
      rendererLog.error('[LoggingSettings] Failed to delete old logs:', error)
      showToast({
        variant: 'error',
        title: 'Failed to delete old logs',
        message: 'Could not delete old log files. Please try again.',
        duration: 4000
      })
    } finally {
      setIsDeletingOld(false)
    }
  }

  const handleClearLogs = async (): Promise<void> => {
    // Show confirmation dialog
    const confirmed = await globalThis.api.showConfirmDialog(
      'Clear all logs?',
      'This will permanently delete all log files. This action cannot be undone.'
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
        title: 'Logs cleared',
        message: 'All log files have been deleted.',
        duration: 3000
      })
    } catch (error) {
      rendererLog.error('[LoggingSettings] Failed to clear logs:', error)
      showToast({
        variant: 'error',
        title: 'Failed to clear logs',
        message: 'Could not delete log files. Please try again.',
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
        <h2 className="settings-view__section-heading">Logging</h2>
        <p className="settings-view__section-description">
          DexReader maintains log files to help diagnose issues and track application behaviour. You
          can configure how long logs are retained and manage existing log files from this section.
        </p>

        <div className="flex flex-col gap-4">
          {/* Log Retention Period */}
          <div className="flex flex-col gap-2">
            <RadioGroup
              name="log-retention"
              value={retentionDays.toString()}
              onChange={handleRetentionChange}
              orientation="horizontal"
              label="Log Retention Period"
            >
              <Radio value="3" label="3 days" />
              <Radio value="7" label="7 days (default, Recommended)" />
              <Radio value="14" label="14 days" />
              <Radio value="30" label="30 days" />
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
              Open Logs Folder
            </Button>
            <Button
              variant="secondary"
              onClick={handleDeleteOldLogs}
              disabled={isDeletingOld}
              loading={isDeletingOld}
            >
              Delete Old Logs
            </Button>
            <Button
              variant="danger"
              onClick={handleClearLogs}
              disabled={isClearing}
              loading={isClearing}
            >
              Clear All Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
