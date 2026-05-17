import React, { useState } from 'react'
import { FolderOpen24Regular, ArrowReset24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './DangerZoneSettings.css'
import { rendererLog } from '@renderer/services/logging.service'

export const DangerZoneSettings: React.FC = () => {
  const { t } = useTranslation('settings')
  const [isResetting, setIsResetting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleOpenFile = async (): Promise<void> => {
    try {
      const result = await globalThis.settings.openFile()
      if (!result.success) {
        throw new Error('Failed to open settings file')
      }
    } catch (error) {
      rendererLog.error('[DangerZoneSettings] Failed to open settings file:', error)
    }
  }

  const handleResetToDefault = async (): Promise<void> => {
    const result = await globalThis.api.showConfirmDialog(
      t('dangerZone.reset.confirm.title', { defaultValue: 'Reset Settings to Default?' }),
      t('dangerZone.reset.confirm.message', {
        defaultValue:
          'This will restore all settings to their default values.\n\nYour library and reading progress will NOT be affected.'
      }),
      t('dangerZone.reset.confirm.confirmButton', { defaultValue: 'Reset Settings' }),
      t('dangerZone.reset.confirm.cancelButton', { defaultValue: 'Cancel' })
    )

    // Check IpcResponse: result.success && result.data means user confirmed
    if (!result.success || !result.data) return

    setIsResetting(true)
    try {
      const result = await globalThis.settings.resetToDefaults()
      if (!result.success) {
        throw new Error('Failed to reset settings')
      }
      localStorage.removeItem('suppressCacheWarnings')
      // Reload page to reflect new settings
      globalThis.location.reload()
    } catch (error) {
      rendererLog.error('[DangerZoneSettings] Failed to reset settings:', error)
      setIsResetting(false)
    }
  }

  const handleClearAllData = async (): Promise<void> => {
    const result = await globalThis.api.showConfirmDialog(
      t('dangerZone.clearAll.confirm.title', { defaultValue: 'Clear All Data?' }),
      t('dangerZone.clearAll.confirm.message', {
        defaultValue:
          'This action cannot be undone.\n\nAll of the following will be permanently deleted:\n• Library and collections\n• Reading progress and history\n• All settings and preferences\n\nThe app will restart after clearing data.'
      }),
      t('dangerZone.clearAll.confirm.confirmButton', { defaultValue: 'Clear All Data' }),
      t('dangerZone.clearAll.confirm.cancelButton', { defaultValue: 'Cancel' })
    )

    // Check IpcResponse: result.success && result.data means user confirmed
    if (!result.success || !result.data) return

    setIsClearing(true)
    try {
      const result = await globalThis.settings.clearAllData()
      if (!result.success) {
        throw new Error('Failed to clear data')
      }
      // App will restart automatically
    } catch (error) {
      rendererLog.error('[DangerZoneSettings] Failed to clear data:', error)
      setIsClearing(false)
    }
  }

  return (
    <div className="danger-zone-settings">
      <h3>{t('dangerZone.title', { defaultValue: 'Danger Zone' })}</h3>
      <p className="danger-zone-description">
        {t('dangerZone.description', {
          defaultValue: 'Irreversible actions. Proceed with caution.'
        })}
      </p>

      <div className="danger-zone-actions flex flex-col gap-4">
        {/* Open Settings File */}
        <div className="danger-zone-item flex items-center justify-between">
          <div className="danger-zone-item-info">
            <h4>{t('dangerZone.openFile.title', { defaultValue: 'Open Settings File' })}</h4>
            <p>
              {t('dangerZone.openFile.description', {
                defaultValue: 'Edit settings.json directly in your default editor'
              })}
            </p>
          </div>
          <Button variant="secondary" icon={<FolderOpen24Regular />} onClick={handleOpenFile}>
            {t('dangerZone.openFile.button', { defaultValue: 'Open File' })}
          </Button>
        </div>

        {/* Reset to Default */}
        <div className="danger-zone-item flex items-center justify-between">
          <div className="danger-zone-item-info">
            <h4>{t('dangerZone.reset.title', { defaultValue: 'Reset to Default' })}</h4>
            <p>
              {t('dangerZone.reset.description', {
                defaultValue: 'Restore all settings to their default values'
              })}
            </p>
          </div>
          <Button
            variant="warning"
            icon={<ArrowReset24Regular />}
            onClick={handleResetToDefault}
            loading={isResetting}
          >
            {isResetting
              ? t('dangerZone.reset.buttonLoading', { defaultValue: 'Resetting...' })
              : t('dangerZone.reset.button', { defaultValue: 'Reset Settings' })}
          </Button>
        </div>

        {/* Clear All Data */}
        <div className="danger-zone-item danger-zone-item-critical flex items-center justify-between">
          <div className="danger-zone-item-info">
            <h4>{t('dangerZone.clearAll.title', { defaultValue: 'Clear Data & Reset App' })}</h4>
            <p>
              {t('dangerZone.clearAll.description', {
                defaultValue: 'Delete all data (library, progress, settings) and restart'
              })}
            </p>
          </div>
          <Button
            variant="danger"
            icon={<Delete24Regular />}
            onClick={handleClearAllData}
            loading={isClearing}
          >
            {isClearing
              ? t('dangerZone.clearAll.buttonLoading', { defaultValue: 'Clearing...' })
              : t('dangerZone.clearAll.button', { defaultValue: 'Clear All Data' })}
          </Button>
        </div>
      </div>
    </div>
  )
}
